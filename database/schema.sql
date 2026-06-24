-- Drop existing tables to allow safe re-runs
DROP TABLE IF EXISTS group_expenses CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS shared_groups CASCADE;
DROP TABLE IF EXISTS personal_expenses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  upi_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Personal expenses table
CREATE TABLE personal_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Shared groups table
CREATE TABLE shared_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Group members join table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES shared_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Group expenses table
CREATE TABLE group_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES shared_groups(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Group settlements table (when a user pays back a debt)
CREATE TABLE group_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES shared_groups(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  paid_to UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Group messages table
CREATE TABLE group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES shared_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 2. Personal expenses policies
CREATE POLICY "Users can manage their own personal expenses" ON personal_expenses
  FOR ALL USING (auth.uid() = user_id);

-- Helper function to check group membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(checking_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = checking_group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Shared groups policies
CREATE POLICY "Users can view groups they are members of" ON shared_groups
  FOR SELECT USING (
    created_by = auth.uid() OR public.is_group_member(id)
  );

CREATE POLICY "Users can create groups" ON shared_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Only the creator can delete their group" ON shared_groups
  FOR DELETE USING (auth.uid() = created_by);

-- 4. Group members policies
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_group_member(group_id)
  );

CREATE POLICY "Group members can add other members" ON group_members
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id) OR (
      -- the creator adds themselves initially
      EXISTS (
        SELECT 1 FROM shared_groups
        WHERE shared_groups.id = group_id
        AND shared_groups.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can be deleted by creator or self" ON group_members
  FOR DELETE USING (
    user_id = auth.uid() OR (
      EXISTS (
        SELECT 1 FROM shared_groups
        WHERE shared_groups.id = group_id
        AND shared_groups.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own membership" ON group_members
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Group expenses policies
CREATE POLICY "Users can view expenses of their groups" ON group_expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add group expenses" ON group_expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_expenses.group_id
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = paid_by
  );

CREATE POLICY "Users can delete group expenses they created" ON group_expenses
  FOR DELETE USING (auth.uid() = paid_by);

-- 5.5 Group settlements policies
CREATE POLICY "Users can view settlements of their groups" ON group_settlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_settlements.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add settlements" ON group_settlements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_settlements.group_id
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = paid_by
  );

-- 6. Group messages policies
CREATE POLICY "Users can view messages of their groups" ON group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can insert messages" ON group_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    ) AND auth.uid() = user_id
  );

-- Create a trigger function to handle new user registration from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a user profile when a user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

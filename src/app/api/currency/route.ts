import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency');

  if (!currency) {
    return NextResponse.json({ error: 'Currency parameter is required' }, { status: 400 });
  }

  try {
    const currencyLower = currency.toLowerCase();
    
    // Using the public open-source API for currency rates
    const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currencyLower}.json`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch from external API: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    if (!data || !data[currencyLower] || typeof data[currencyLower]['inr'] === 'undefined') {
      throw new Error('Invalid data structure returned from API');
    }

    const rate = data[currencyLower]['inr'];
    
    // We implement some logic here (e.g., adding a small buffer or just returning the rate)
    // For this assignment, we simply fetch and return the rate in a standardized format
    return NextResponse.json({ 
      currency: currency.toUpperCase(),
      base: 'INR',
      rate: rate,
      timestamp: data.date || new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error("Currency API error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch exchange rate' }, { status: 500 });
  }
}

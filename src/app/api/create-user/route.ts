import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  try {
    const { email, password = 'defaultPassword123!' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true, // Mark email as confirmed
        user_metadata: { 
          // Add any additional user metadata here
          created_via: 'admin_dashboard'
        },
        app_metadata: {
          // Add any app-specific metadata here
          provider: 'email'
        }
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Error creating user:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Failed to create user' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      user: responseData,
      message: 'User created successfully with confirmed email'
    });

  } catch (error) {
    console.error('Error in create-user API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

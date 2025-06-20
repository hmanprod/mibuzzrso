import { createClient } from '@/lib/supabase/client';

export default async function SupabaseTestPage() {
  console.log(`NEXT_PUBLIC_SUPABASE_URL (server-side): ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  // Try to fetch a list of tables (public schema) as a basic test
  // We'll use the 'select 1' query to check connection
  let status = 'unknown';
  let errorMsg = '';

  try {
    // This will fail gracefully if no table 'test' exists, but will prove the connection
    const supabase = createClient();
    const { error } = await supabase.from('test').select('*').limit(1);
    if (error) {
      status = 'error';
      errorMsg = error.message;
    } else {
      status = 'success';
    }
  } catch (err: unknown) {
    status = 'error';
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Supabase Connection Test</h1>
      <p>Status: <b>{status}</b></p>
      {errorMsg && <pre style={{ color: 'red' }}>{errorMsg}</pre>}
      <p>
        {status === 'success'
          ? 'Successfully connected to Supabase!'
          : 'Could not connect to Supabase. Check your credentials and table.'}
      </p>
    </div>
  );
}

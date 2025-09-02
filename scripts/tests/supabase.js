require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function testSupabase() {
  console.log('Démarrage du backup...');
  
  try {
    console.log('Configuration de la connexion Supabase...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Test de connexion : ' + process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Test de connexion avec timeout
    const timeout = setTimeout(() => {
      console.error('Timeout de connexion après 60 secondes');
      process.exit(1);
    }, 60000);

    try {
      // Test de connexion en utilisant une requête système
      const { data, error } = await supabase
        .rpc('version');
      
      if (error) throw error;
      
      clearTimeout(timeout);
      console.log('Connexion réussie !');
    } catch (connError) {
      clearTimeout(timeout);
      throw connError;
    }

  } catch (err) {
    console.error('Erreur détaillée lors du backup:');
    console.error('Type d\'erreur:', err.constructor.name);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
    
    if (err.errors) {
      console.error('Erreurs sous-jacentes:');
      err.errors.forEach((e, i) => {
        console.error(`  ${i + 1}. ${e.message} (${e.code})`);
        if (e.stack) console.error(`     Stack: ${e.stack}`);
      });
    }
    
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
    
    process.exit(1);
  }
}

testSupabase();

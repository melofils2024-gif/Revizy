// Debug script to test Supabase database connection and curriculum loading
const { createClient } = require('@supabase/supabase-js');

const cfg = {
  SUPABASE_URL: "https://wvbpiqchgwyeqyzuxtpp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_VWHn1X2kqZmlBRdcm-7GHw_0NFLwV3D"
};

const supabaseClient = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection with a simple query
    console.log('\n📊 Test 1: Basic connection test');
    const { data: connectionTest, error: connectionError } = await supabaseClient
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection failed:', connectionError.message);
      return false;
    } else {
      console.log('✅ Basic connection successful');
    }

    // Test 2: Check if tables exist
    console.log('\n📊 Test 2: Check if curriculum tables exist');
    const { data: tableTest, error: tableError } = await supabaseClient
      .from('subjects')
      .select('id, name, niveau_code, serie_code')
      .limit(5);
    
    if (tableError) {
      console.log('❌ Tables not found:', tableError.message);
      console.log('💡 Database likely not seeded with curriculum schema');
      return false;
    } else {
      console.log('✅ Curriculum tables exist');
      console.log('📋 Sample subjects:', tableTest);
    }

    // Test 3: Test RPC function
    console.log('\n📊 Test 3: Test get_curriculum_topics RPC');
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('get_curriculum_topics', {
      p_niveau: 'bac',
      p_serie: 'C',
      p_subject: 'Mathématiques'
    });
    
    if (rpcError) {
      console.log('❌ RPC failed:', rpcError.message);
      console.log('💡 RPC function likely not created in database');
      return false;
    } else {
      console.log('✅ RPC function works');
      console.log('📋 Curriculum data for Mathématiques BAC C:', rpcData);
    }

    // Test 4: Test all subjects for BAC C
    console.log('\n📊 Test 4: Get all subjects for BAC C');
    const { data: allSubjects, error: allError } = await supabaseClient.rpc('get_curriculum_topics', {
      p_niveau: 'bac',
      p_serie: 'C',
      p_subject: null
    });
    
    if (allError) {
      console.log('❌ All subjects query failed:', allError.message);
    } else {
      console.log('✅ All BAC C subjects:');
      allSubjects?.forEach(subject => {
        console.log(`   📚 ${subject.subject_name}: ${subject.topics?.length || 0} chapters`);
        if (subject.topics?.length <= 2) {
          console.log(`   ⚠️  Only ${subject.topics?.length} chapters for ${subject.subject_name}!`);
        }
      });
    }

    return true;
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

testDatabaseConnection().then((success) => {
  if (success) {
    console.log('\n🎉 Database connection and curriculum loading work correctly!');
  } else {
    console.log('\n💥 Database issues detected. Check Supabase configuration and seeding.');
  }
  process.exit(0);
});
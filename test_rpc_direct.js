const { createClient } = require('@supabase/supabase-js');

const cfg = {
  SUPABASE_URL: "https://wvbpiqchgwyeqyzuxtpp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_VWHn1X2kqZmlBRdcm-7GHw_0NFLwV3D"
};

const supabaseClient = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

async function testDirectRPC() {
  console.log('🔄 Testing direct RPC call...\n');
  
  try {
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('get_curriculum_topics', {
      p_niveau: 'bac',
      p_serie: 'C', 
      p_subject: 'SVT'
    });
    
    if (rpcError) {
      console.log('❌ RPC Error:', rpcError);
      
      // Test if any tables exist
      const { data: tableData, error: tableError } = await supabaseClient
        .from('curriculum_topics')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.log('❌ curriculum_topics table error:', tableError.message);
      } else {
        console.log('✅ curriculum_topics table exists, sample:', tableData);
      }
      
    } else {
      console.log('✅ RPC Success! Data:', rpcData);
      
      if (rpcData && rpcData.length > 0) {
        const subject = rpcData[0];
        console.log(`📚 Subject: ${subject.subject_name}`);
        console.log(`📖 Topics count: ${subject.topics?.length || 0}`);
        if (subject.topics?.length > 0) {
          console.log('📋 Chapters:');
          subject.topics.slice(0, 3).forEach((topic, index) => {
            console.log(`   ${index + 1}. ${topic}`);
          });
          if (subject.topics.length > 3) {
            console.log(`   ... and ${subject.topics.length - 3} more chapters`);
          }
        }
      }
    }
    
  } catch (error) {
    console.log('💥 Exception:', error.message);
  }
}

testDirectRPC();

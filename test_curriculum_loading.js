const { createClient } = require('@supabase/supabase-js');
const config = require('./config.js');

const supabaseClient = createClient(config.supabaseUrl, config.supabaseKey);

async function testCurriculumLoading() {
    console.log('🧪 TEST: Chargement complet du curriculum depuis Supabase\n');
    
    const testCases = [
        { niveau: 'bac', serie: 'C', subject: 'SVT' },
        { niveau: 'bac', serie: 'C', subject: 'Mathématiques' }, 
        { niveau: 'bac', serie: 'C', subject: 'Physique-Chimie' },
        { niveau: 'bac', serie: 'A', subject: 'Français' },
        { niveau: 'brevet', serie: null, subject: 'Mathématiques' },
        { niveau: 'brevet', serie: null, subject: 'SVT' }
    ];

    let totalChapters = 0;
    let totalSubjects = 0;
    
    for (const testCase of testCases) {
        const { niveau, serie, subject } = testCase;
        
        try {
            console.log(`\n📚 Testing: ${subject} (${niveau}${serie ? ` série ${serie}` : ''})`);
            
            const { data, error } = await supabaseClient.rpc('get_curriculum_topics', {
                p_niveau: niveau,
                p_serie: serie,
                p_subject: subject
            });

            if (error) {
                console.error(`❌ RPC Error for ${subject}:`, error.message);
                continue;
            }

            if (!data || data.length === 0) {
                console.log(`⚠️  No data found for ${subject}`);
                continue;
            }

            const row = data[0];
            const topics = row.topics || [];
            
            if (topics.length > 0) {
                totalChapters += topics.length;
                totalSubjects++;
                
                console.log(`✅ ${topics.length} chapters loaded:`);
                topics.forEach((topic, index) => {
                    const isFree = index < 3;
                    const price = niveau === 'brevet' ? 100 : 150;
                    console.log(`   ${index + 1}. ${topic} ${isFree ? '(GRATUIT)' : `(${price} FCFA)`}`);
                });
            }
            
        } catch (err) {
            console.error(`💥 Exception for ${subject}:`, err.message);
        }
    }
    
    console.log(`\n📊 RÉSUMÉ DU TEST:`);
    console.log(`   Matières testées: ${testCases.length}`);
    console.log(`   Matières avec chapitres: ${totalSubjects}`);  
    console.log(`   Total chapitres chargés: ${totalChapters}`);
    
    if (totalSubjects >= 4 && totalChapters >= 30) {
        console.log(`\n🎉 ✅ TEST RÉUSSI - Curriculum complet chargé!`);
    } else {
        console.log(`\n⚠️  ATTENTION - Certains cours manquent`);
    }
}

async function runAllTests() {
    console.log('🚀 LANCEMENT DES TESTS COMPLETS REVIZY\n');
    await testCurriculumLoading();
    console.log('\n🏁 TESTS TERMINÉS');
}

runAllTests().catch(console.error);

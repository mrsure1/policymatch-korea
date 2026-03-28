import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);


async function checkDocumentData() {
    // 서류 데이터가 있는 정책 조회
    const { data, error } = await supabase
        .from('policy_funds')
        .select('id, title, documents, raw_content')
        .not('documents', 'eq', '[]')
        .limit(5);



    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found policies:', data?.length);

    data?.forEach((policy) => {
        console.log('\n=== Policy:', policy.id, '===');
        console.log('Title:', policy.title);
        console.log('\ndocuments type:', typeof policy.documents);
        console.log('documents:', JSON.stringify(policy.documents, null, 2));

        // raw_content 전체 출력 (제출서류 부분 확인)
        if (policy.raw_content) {
            console.log('\n=== RAW CONTENT (first 3000 chars) ===');
            console.log(policy.raw_content.substring(0, 3000));

            const match = policy.raw_content.match(/제출서류[\s\S]{0,2000}/i);
            if (match) {
                console.log('\n=== 제출서류 섹션 ===');
                console.log(match[0]);
            }
        }
    });
}

checkDocumentData();

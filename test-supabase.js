// Supabase 연결 테스트
const supabaseClient = require('./supabase-client');

async function testSupabaseConnection() {
    console.log('Supabase 연결 테스트 시작...');
    
    try {
        // 1. 모든 항목 가져오기 테스트
        console.log('1. 모든 항목 가져오기 테스트...');
        const items = await supabaseClient.getAllItems();
        console.log(`현재 항목 수: ${items.length}`);
        
        // 2. 새 항목 추가 테스트
        console.log('2. 새 항목 추가 테스트...');
        const testItem = {
            id: Date.now(),
            text: '테스트 항목',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        const addedItem = await supabaseClient.addItem(testItem);
        if (addedItem) {
            console.log('항목 추가 성공:', addedItem.text);
        } else {
            console.log('항목 추가 실패');
        }
        
        // 3. 항목 상태 업데이트 테스트
        console.log('3. 항목 상태 업데이트 테스트...');
        if (addedItem) {
            const updateSuccess = await supabaseClient.updateItemCompletion(addedItem.id, true);
            console.log(`항목 상태 업데이트: ${updateSuccess ? '성공' : '실패'}`);
        }
        
        // 4. 항목 삭제 테스트
        console.log('4. 항목 삭제 테스트...');
        if (addedItem) {
            const deleteSuccess = await supabaseClient.deleteItem(addedItem.id);
            console.log(`항목 삭제: ${deleteSuccess ? '성공' : '실패'}`);
        }
        
        // 5. 최종 항목 수 확인
        console.log('5. 최종 항목 수 확인...');
        const finalItems = await supabaseClient.getAllItems();
        console.log(`최종 항목 수: ${finalItems.length}`);
        
        console.log('\n✅ Supabase 연결 테스트 완료!');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase 연결 테스트 실패:', error.message);
        return false;
    }
}

// 테스트 실행
testSupabaseConnection().then(success => {
    if (success) {
        console.log('\n🎉 모든 테스트가 성공적으로 완료되었습니다!');
        process.exit(0);
    } else {
        console.log('\n⚠️  테스트 중 문제가 발생했습니다.');
        process.exit(1);
    }
});
// 쇼핑 리스트 앱 헤드리스 테스트 스크립트
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class ShoppingListHeadlessTester {
    constructor() {
        this.testResults = [];
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 쇼핑 리스트 앱 헤드리스 테스트 시작...\n');
        
        this.browser = await chromium.launch({ 
            headless: true // 헤드리스 모드
        });
        
        this.page = await this.browser.newPage();
        
        const htmlPath = path.join(__dirname, 'index.html');
        await this.page.goto(`file://${htmlPath}`);
        
        await this.page.waitForSelector('.container');
        console.log('✅ 앱 로드 완료\n');
    }

    async logTestResult(testName, passed, details = '') {
        const result = {
            testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName}`);
        if (details) {
            console.log(`   📝 ${details}`);
        }
    }

    async testClearCompletedDetailed() {
        console.log('\n🧹 완료된 항목 삭제 기능 상세 테스트');
        
        try {
            // 1. 먼저 모든 항목 삭제 (깨끗한 상태에서 시작)
            await this.page.evaluate(() => {
                localStorage.clear();
                location.reload();
            });
            
            await this.page.waitForSelector('.container');
            await this.page.waitForTimeout(500);

            // 2. 테스트 항목 추가
            const testItems = ['삭제테스트1', '삭제테스트2', '삭제테스트3'];
            
            for (const item of testItems) {
                await this.page.fill('#itemInput', item);
                await this.page.click('#addButton');
                await this.page.waitForTimeout(100);
            }

            // 3. 첫 번째 항목 체크
            await this.page.click('.shopping-item:nth-child(1) input[type="checkbox"]');
            await this.page.waitForTimeout(500);

            // 4. 통계 확인
            const completedBefore = await this.page.$eval('#completedCount', el => parseInt(el.textContent));
            const totalBefore = await this.page.$eval('#totalCount', el => parseInt(el.textContent));
            
            console.log(`   📊 삭제 전: 전체 ${totalBefore}개, 완료 ${completedBefore}개`);

            // 5. 삭제 버튼 클릭 전 confirm 대화상자 모니터링
            this.page.on('dialog', async dialog => {
                console.log(`   💬 confirm 대화상자: "${dialog.message()}"`);
                await dialog.accept();
            });

            // 6. 삭제 버튼 클릭
            await this.page.click('#clearCompleted');
            await this.page.waitForTimeout(1000);

            // 7. 삭제 후 통계 확인
            const completedAfter = await this.page.$eval('#completedCount', el => parseInt(el.textContent));
            const totalAfter = await this.page.$eval('#totalCount', el => parseInt(el.textContent));
            
            console.log(`   📊 삭제 후: 전체 ${totalAfter}개, 완료 ${completedAfter}개`);

            // 8. 실제 항목 수 확인
            const itemsAfter = await this.page.$$('.shopping-item');
            console.log(`   📋 실제 DOM 항목: ${itemsAfter.length}개`);

            // 9. 로컬 스토리지 확인
            const localStorageData = await this.page.evaluate(() => {
                return JSON.parse(localStorage.getItem('shoppingListItems') || '[]');
            });
            
            console.log(`   💾 로컬스토리지 항목: ${localStorageData.length}개`);
            console.log(`   ✅ 완료된 항목: ${localStorageData.filter(item => item.completed).length}개`);

            // 10. 검증
            const expectedTotal = totalBefore - completedBefore;
            const success = totalAfter === expectedTotal && completedAfter === 0;
            
            await this.logTestResult('완료된 항목 삭제 상세 테스트', success,
                success ? `삭제 성공: ${totalBefore} → ${totalAfter}` : 
                         `삭제 실패: ${totalBefore} → ${totalAfter}, 완료: ${completedBefore} → ${completedAfter}`);

            return success;
        } catch (error) {
            await this.logTestResult('완료된 항목 삭제 상세 테스트', false, `오류: ${error.message}`);
            return false;
        }
    }

    async testBasicFunctions() {
        console.log('\n🔧 기본 기능 테스트');
        
        try {
            // 항목 추가 테스트
            await this.page.fill('#itemInput', '기본기능테스트');
            await this.page.click('#addButton');
            await this.page.waitForTimeout(300);

            const items = await this.page.$$('.shopping-item');
            const itemAdded = items.length > 0;
            await this.logTestResult('항목 추가', itemAdded, `항목 수: ${items.length}`);

            // 체크 기능 테스트
            if (items.length > 0) {
                await this.page.click('.shopping-item:last-child input[type="checkbox"]');
                await this.page.waitForTimeout(300);
                
                const isChecked = await this.page.isChecked('.shopping-item:last-child input[type="checkbox"]');
                await this.logTestResult('체크 기능', isChecked, `체크 상태: ${isChecked}`);
            }

            // 삭제 기능 테스트
            const beforeDelete = items.length;
            await this.page.click('.shopping-item:last-child .delete-btn');
            await this.page.waitForTimeout(500);
            
            const afterDelete = await this.page.$$('.shopping-item');
            const deleteSuccess = afterDelete.length === beforeDelete - 1;
            await this.logTestResult('항목 삭제', deleteSuccess, `${beforeDelete} → ${afterDelete.length}`);

            return true;
        } catch (error) {
            console.log(`❌ 기본 기능 테스트 오류: ${error.message}`);
            return false;
        }
    }

    async generateReport() {
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(60));
        console.log('📈 헤드리스 테스트 결과');
        console.log('='.repeat(60));
        console.log(`총 테스트 수: ${totalTests}`);
        console.log(`통과 테스트: ${passedTests}`);
        console.log(`실패 테스트: ${totalTests - passedTests}`);
        console.log(`통과율: ${passRate}%`);
        console.log('='.repeat(60));

        return passRate;
    }

    async runTests() {
        try {
            await this.initialize();
            await this.testClearCompletedDetailed();
            await this.testBasicFunctions();
            
            const passRate = await this.generateReport();
            
            await this.browser.close();
            
            console.log('\n🎉 헤드리스 테스트 완료!');
            return passRate >= 80;
        } catch (error) {
            console.error('테스트 실행 중 오류:', error);
            if (this.browser) {
                await this.browser.close();
            }
            return false;
        }
    }
}

// 테스트 실행
(async () => {
    const tester = new ShoppingListHeadlessTester();
    const success = await tester.runTests();
    
    process.exit(success ? 0 : 1);
})();
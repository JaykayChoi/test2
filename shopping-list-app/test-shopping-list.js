// 쇼핑 리스트 앱 자동화 테스트 스크립트
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class ShoppingListTester {
    constructor() {
        this.testResults = [];
        this.browser = null;
        this.page = null;
        this.testStartTime = null;
    }

    async initialize() {
        console.log('🚀 쇼핑 리스트 앱 테스트 시작...\n');
        this.testStartTime = Date.now();
        
        // 브라우저 실행
        this.browser = await chromium.launch({ 
            headless: false, // 테스트 과정을 보기 위해 headless: false로 설정
            slowMo: 100 // 동작을 천천히 보기 위해
        });
        
        this.page = await this.browser.newPage();
        
        // 페이지 로드
        const htmlPath = path.join(__dirname, 'index.html');
        await this.page.goto(`file://${htmlPath}`);
        
        // 페이지가 완전히 로드될 때까지 대기
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
        console.log('');
    }

    async testAddItem() {
        console.log('📋 항목 추가 기능 테스트');
        
        try {
            // 1. 빈 입력 테스트
            await this.page.click('#addButton');
            await this.page.waitForTimeout(500);
            
            const notification = await this.page.$('.notification');
            if (notification) {
                await this.logTestResult('빈 입력 시 알림 표시', true, '빈 항목 추가 시 에러 알림이 표시됨');
            } else {
                await this.logTestResult('빈 입력 시 알림 표시', false, '에러 알림이 표시되지 않음');
            }

            // 2. 정상 항목 추가 테스트
            const testItem = '테스트 항목 - 사과';
            await this.page.fill('#itemInput', testItem);
            await this.page.click('#addButton');
            await this.page.waitForTimeout(1000);

            // 추가된 항목 확인
            const items = await this.page.$$('.shopping-item');
            const lastItem = items[items.length - 1];
            const itemText = await lastItem.$eval('.item-content', el => el.textContent);
            
            if (itemText === testItem) {
                await this.logTestResult('항목 추가 기능', true, `"${testItem}" 항목이 정상적으로 추가됨`);
            } else {
                await this.logTestResult('항목 추가 기능', false, `항목 추가 실패: "${itemText}"`);
            }

            // 3. Enter 키로 추가 테스트
            const testItem2 = '테스트 항목 - 우유 (Enter 키)';
            await this.page.fill('#itemInput', testItem2);
            await this.page.press('#itemInput', 'Enter');
            await this.page.waitForTimeout(1000);

            const itemsAfterEnter = await this.page.$$('.shopping-item');
            const newItem = itemsAfterEnter[itemsAfterEnter.length - 1];
            const newItemText = await newItem.$eval('.item-content', el => el.textContent);
            
            if (newItemText === testItem2) {
                await this.logTestResult('Enter 키 항목 추가', true, 'Enter 키로 항목 추가 기능 정상 작동');
            } else {
                await this.logTestResult('Enter 키 항목 추가', false, 'Enter 키로 항목 추가 실패');
            }

            // 4. 입력창 초기화 확인
            const inputValue = await this.page.$eval('#itemInput', el => el.value);
            if (inputValue === '') {
                await this.logTestResult('입력창 초기화', true, '항목 추가 후 입력창이 초기화됨');
            } else {
                await this.logTestResult('입력창 초기화', false, `입력창 초기화 실패: "${inputValue}"`);
            }

            return true;
        } catch (error) {
            await this.logTestResult('항목 추가 기능', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async testCheckItem() {
        console.log('✅ 체크 기능 테스트');
        
        try {
            // 테스트용 항목 추가 (기존 항목에 의존하지 않음)
            await this.page.fill('#itemInput', '체크 테스트 항목');
            await this.page.click('#addButton');
            await this.page.waitForTimeout(500);

            // 방금 추가된 항목 찾기 (마지막 항목)
            const items = await this.page.$$('.shopping-item');
            if (items.length === 0) {
                await this.logTestResult('체크 기능', false, '테스트할 항목이 없음');
                return false;
            }

            // 체크박스 찾기 (더 안정적인 방법)
            const checkboxSelector = '.shopping-item:last-child input[type="checkbox"]';
            await this.page.waitForSelector(checkboxSelector);
            
            // 체크 전 상태 확인
            const initialChecked = await this.page.isChecked(checkboxSelector);
            
            if (initialChecked) {
                // 이미 체크된 항목이면 체크 해제 테스트
                await this.page.click(checkboxSelector);
                await this.page.waitForTimeout(500);
                
                const afterUncheck = await this.page.isChecked(checkboxSelector);
                if (!afterUncheck) {
                    await this.logTestResult('체크 해제 기능', true, '항목 체크 해제 기능 정상 작동');
                } else {
                    await this.logTestResult('체크 해제 기능', false, '체크 해제 기능 실패');
                }
                
                // 다시 체크
                await this.page.click(checkboxSelector);
                await this.page.waitForTimeout(500);
            } else {
                // 체크되지 않은 항목이면 체크 테스트
                await this.page.click(checkboxSelector);
                await this.page.waitForTimeout(500);
                
                const afterCheck = await this.page.isChecked(checkboxSelector);
                if (afterCheck) {
                    await this.logTestResult('체크 기능', true, '항목 체크 기능 정상 작동');
                } else {
                    await this.logTestResult('체크 기능', false, '체크 기능 실패');
                }
            }

            // CSS 클래스 변경 확인
            const contentSelector = '.shopping-item:last-child .item-content';
            const hasCompletedClass = await this.page.$eval(contentSelector, el => el.classList.contains('completed'));
            
            if (hasCompletedClass) {
                await this.logTestResult('CSS 클래스 업데이트', true, '체크 시 completed 클래스가 적용됨');
            } else {
                await this.logTestResult('CSS 클래스 업데이트', false, 'completed 클래스가 적용되지 않음');
            }

            // 통계 업데이트 확인
            const completedCount = await this.page.$eval('#completedCount', el => parseInt(el.textContent));
            if (completedCount > 0) {
                await this.logTestResult('통계 업데이트', true, `구매 완료 수: ${completedCount}`);
            } else {
                await this.logTestResult('통계 업데이트', false, '구매 완료 수가 업데이트되지 않음');
            }

            return true;
        } catch (error) {
            await this.logTestResult('체크 기능', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async testDeleteItem() {
        console.log('🗑️ 항목 삭제 기능 테스트');
        
        try {
            // 항목 개수 확인
            const itemsBefore = await this.page.$$('.shopping-item');
            const initialCount = itemsBefore.length;
            
            if (initialCount === 0) {
                await this.logTestResult('항목 삭제', false, '삭제할 항목이 없음');
                return false;
            }

            // 첫 번째 항목 삭제
            const firstItem = itemsBefore[0];
            const deleteButton = await firstItem.$('.delete-btn');
            await deleteButton.click();
            await this.page.waitForTimeout(1000);

            // 삭제 후 항목 개수 확인
            const itemsAfter = await this.page.$$('.shopping-item');
            const afterCount = itemsAfter.length;

            if (afterCount === initialCount - 1) {
                await this.logTestResult('항목 삭제 기능', true, `항목 삭제 성공 (${initialCount} → ${afterCount})`);
            } else {
                await this.logTestResult('항목 삭제 기능', false, `항목 삭제 실패 (${initialCount} → ${afterCount})`);
            }

            // 알림 확인
            const notification = await this.page.$('.notification');
            if (notification) {
                const notificationText = await notification.textContent();
                await this.logTestResult('삭제 알림', true, `알림 메시지: "${notificationText}"`);
            } else {
                await this.logTestResult('삭제 알림', false, '삭제 알림이 표시되지 않음');
            }

            return true;
        } catch (error) {
            await this.logTestResult('항목 삭제 기능', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async testFiltering() {
        console.log('🔍 필터링 기능 테스트');
        
        try {
            // 먼저 몇 개의 항목을 추가하고 체크
            const testItems = ['필터 테스트 1', '필터 테스트 2', '필터 테스트 3'];
            
            for (const item of testItems) {
                await this.page.fill('#itemInput', item);
                await this.page.click('#addButton');
                await this.page.waitForTimeout(300);
            }

            // 두 번째 항목 체크 (구매 완료로 만들기)
            const items = await this.page.$$('.shopping-item');
            const secondItem = items[1];
            const checkbox = await secondItem.$('input[type="checkbox"]');
            await checkbox.click();
            await this.page.waitForTimeout(500);

            // 필터 버튼 테스트
            const filterButtons = await this.page.$$('.filter-btn');
            
            // 1. '구매 예정' 필터 테스트
            await filterButtons[1].click(); // data-filter="active"
            await this.page.waitForTimeout(500);
            
            const activeItems = await this.page.$$('.shopping-item');
            const activeCount = activeItems.length;
            
            // 구매 예정 항목은 체크되지 않은 항목만 보여야 함
            if (activeCount > 0) {
                await this.logTestResult('구매 예정 필터', true, `구매 예정 항목: ${activeCount}개`);
            } else {
                await this.logTestResult('구매 예정 필터', false, '구매 예정 필터 작동 실패');
            }

            // 2. '구매 완료' 필터 테스트
            await filterButtons[2].click(); // data-filter="completed"
            await this.page.waitForTimeout(500);
            
            const completedItems = await this.page.$$('.shopping-item');
            const completedCount = completedItems.length;
            
            // 구매 완료 항목은 체크된 항목만 보여야 함
            if (completedCount > 0) {
                await this.logTestResult('구매 완료 필터', true, `구매 완료 항목: ${completedCount}개`);
            } else {
                await this.logTestResult('구매 완료 필터', false, '구매 완료 필터 작동 실패');
            }

            // 3. '전체 보기' 필터 테스트
            await filterButtons[0].click(); // data-filter="all"
            await this.page.waitForTimeout(500);
            
            const allItems = await this.page.$$('.shopping-item');
            const allCount = allItems.length;
            
            if (allCount === activeCount + completedCount) {
                await this.logTestResult('전체 보기 필터', true, `전체 항목: ${allCount}개 (구매 예정: ${activeCount}, 구매 완료: ${completedCount})`);
            } else {
                await this.logTestResult('전체 보기 필터', false, `전체 보기 필터 작동 실패: ${allCount}개`);
            }

            // 필터 버튼 활성화 상태 확인
            const activeFilterButton = await filterButtons[0];
            const hasActiveClass = await activeFilterButton.evaluate(el => el.classList.contains('active'));
            
            if (hasActiveClass) {
                await this.logTestResult('필터 버튼 활성화', true, '전체 보기 버튼이 활성화 상태임');
            } else {
                await this.logTestResult('필터 버튼 활성화', false, '필터 버튼 활성화 상태 오류');
            }

            return true;
        } catch (error) {
            await this.logTestResult('필터링 기능', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async testStatistics() {
        console.log('📊 통계 기능 테스트');
        
        try {
            // 현재 통계 값 읽기
            const totalCount = await this.page.$eval('#totalCount', el => parseInt(el.textContent));
            const completedCount = await this.page.$eval('#completedCount', el => parseInt(el.textContent));
            const remainingCount = await this.page.$eval('#remainingCount', el => parseInt(el.textContent));

            // 통계 일관성 검증
            if (remainingCount === totalCount - completedCount) {
                await this.logTestResult('통계 일관성', true, 
                    `전체: ${totalCount}, 완료: ${completedCount}, 남은: ${remainingCount} (일치함)`);
            } else {
                await this.logTestResult('통계 일관성', false, 
                    `불일치: 전체(${totalCount}) ≠ 완료(${completedCount}) + 남은(${remainingCount})`);
            }

            // 항목 추가 후 통계 업데이트 테스트
            const initialTotal = totalCount;
            await this.page.fill('#itemInput', '통계 테스트 항목');
            await this.page.click('#addButton');
            await this.page.waitForTimeout(500);

            const newTotalCount = await this.page.$eval('#totalCount', el => parseInt(el.textContent));
            
            if (newTotalCount === initialTotal + 1) {
                await this.logTestResult('통계 실시간 업데이트', true, 
                    `항목 추가 후 통계 업데이트: ${initialTotal} → ${newTotalCount}`);
            } else {
                await this.logTestResult('통계 실시간 업데이트', false, 
                    `통계 업데이트 실패: ${initialTotal} → ${newTotalCount}`);
            }

            return true;
        } catch (error) {
            await this.logTestResult('통계 기능', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async testClearCompleted() {
        console.log('🧹 완료된 항목 삭제 기능 테스트');
        
        try {
            // 먼저 몇 개의 항목을 추가하고 일부를 완료 상태로 만듦
            const testItems = ['삭제 테스트 1', '삭제 테스트 2', '삭제 테스트 3'];
            
            for (const item of testItems) {
                await this.page.fill('#itemInput', item);
                await this.page.click('#addButton');
                await this.page.waitForTimeout(300);
            }

            // 첫 번째 항목 체크 (구매 완료) - 안정적인 방법 사용
            const firstCheckboxSelector = '.shopping-item:nth-child(1) input[type="checkbox"]';
            await this.page.waitForSelector(firstCheckboxSelector);
            await this.page.click(firstCheckboxSelector);
            await this.page.waitForTimeout(500);

            // 완료된 항목 수 확인
            const completedCountBefore = await this.page.$eval('#completedCount', el => parseInt(el.textContent));
            const totalCountBefore = await this.page.$eval('#totalCount', el => parseInt(el.textContent));

            // '완료된 항목 삭제' 버튼 클릭
            await this.page.click('#clearCompleted');
            await this.page.waitForTimeout(1000);

            // Playwright는 confirm 대화상자를 자동으로 처리합니다
            // 실제 사용자 환경에서는 confirm 대화상자가 표시됨

            // 삭제 후 통계 확인 (더 긴 대기 시간)
            await this.page.waitForTimeout(1000);
            const totalCountAfter = await this.page.$eval('#totalCount', el => parseInt(el.textContent));
            const completedCountAfter = await this.page.$eval('#completedCount', el => parseInt(el.textContent));

            // 완료된 항목이 삭제되었는지 확인
            const expectedTotal = totalCountBefore - completedCountBefore;
            
            if (totalCountAfter === expectedTotal && completedCountAfter === 0) {
                await this.logTestResult('완료된 항목 삭제', true, 
                    `삭제 성공: 전체 ${totalCountBefore} → ${totalCountAfter}, 완료 ${completedCountBefore} → ${completedCountAfter}`);
            } else {
                // 디버깅 정보 추가
                const currentItems = await this.page.$$('.shopping-item');
                await this.logTestResult('완료된 항목 삭제', false, 
                    `삭제 실패: 전체 ${totalCountBefore} → ${totalCountAfter}, 완료 ${completedCountBefore} → ${completedCountAfter}, 현재 항목: ${currentItems.length}개`);
            }

            return true;
        } catch (error) {
            await this.logTestResult('완료된 항목 삭제', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async testLocalStorage() {
        console.log('💾 로컬 스토리지 기능 테스트');
        
        try {
            // 현재 항목 수 확인
            const itemsBefore = await this.page.$$('.shopping-item');
            const countBefore = itemsBefore.length;

            // 새 항목 추가
            await this.page.fill('#itemInput', '로컬스토리지 테스트 항목');
            await this.page.click('#addButton');
            await this.page.waitForTimeout(500);

            // 페이지 새로고침
            await this.page.reload();
            await this.page.waitForSelector('.container');
            await this.page.waitForTimeout(1000);

            // 새로고침 후 항목 수 확인
            const itemsAfter = await this.page.$$('.shopping-item');
            const countAfter = itemsAfter.length;

            if (countAfter >= countBefore) {
                await this.logTestResult('로컬 스토리지 데이터 유지', true, 
                    `페이지 새로고침 후 데이터 유지: ${countBefore} → ${countAfter} 항목`);
            } else {
                await this.logTestResult('로컬 스토리지 데이터 유지', false, 
                    `데이터 유지 실패: ${countBefore} → ${countAfter} 항목`);
            }

            return true;
        } catch (error) {
            await this.logTestResult('로컬 스토리지 기능', false, `테스트 중 오류: ${error.message}`);
            return false;
        }
    }

    async generateReport() {
        const testEndTime = Date.now();
        const duration = ((testEndTime - this.testStartTime) / 1000).toFixed(2);
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

        console.log('\n' + '='.repeat(60));
        console.log('📈 테스트 결과 보고서');
        console.log('='.repeat(60));
        console.log(`총 테스트 수: ${totalTests}`);
        console.log(`통과 테스트: ${passedTests}`);
        console.log(`실패 테스트: ${totalTests - passedTests}`);
        console.log(`통과율: ${passRate}%`);
        console.log(`테스트 소요 시간: ${duration}초`);
        console.log('='.repeat(60));

        // 실패한 테스트가 있으면 상세 정보 출력
        const failedTests = this.testResults.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ 실패한 테스트:');
            failedTests.forEach(test => {
                console.log(`  - ${test.testName}: ${test.details}`);
            });
        }

        // 결과를 파일로 저장
        const report = {
            summary: {
                totalTests,
                passedTests,
                failedTests: totalTests - passedTests,
                passRate: `${passRate}%`,
                duration: `${duration}초`,
                timestamp: new Date().toISOString()
            },
            details: this.testResults
        };

        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 상세 보고서가 저장되었습니다: ${reportPath}`);

        return passRate;
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            // 모든 테스트 실행
            await this.testAddItem();
            await this.testCheckItem();
            await this.testDeleteItem();
            await this.testFiltering();
            await this.testStatistics();
            await this.testClearCompleted();
            await this.testLocalStorage();
            
            // 보고서 생성
            const passRate = await this.generateReport();
            
            // 브라우저 종료
            await this.browser.close();
            
            console.log('\n🎉 테스트 완료!');
            return passRate >= 80; // 80% 이상 통과 시 성공으로 간주
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
    const tester = new ShoppingListTester();
    const success = await tester.runAllTests();
    
    process.exit(success ? 0 : 1);
})();
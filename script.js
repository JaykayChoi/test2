// 쇼핑 리스트 앱 - JavaScript (Supabase 연동)
// Supabase 설정
const SUPABASE_URL = 'https://lldwzyirjrmlqglnthrj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZHd6eWlyanJtbHFnbG50aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMzM3MzYsImV4cCI6MjA4NjcwOTczNn0.kp8X9vt9ZpeKqC1I-T3C_FfTORZFqPrJ9Vur-IRKE_Y';

// Supabase 클라이언트 초기화 (브라우저에서 사용)
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

class ShoppingListApp {
    constructor() {
        this.items = [];
        this.currentFilter = 'all';
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromSupabase();
    }

    // DOM 요소 초기화
    initializeElements() {
        this.itemInput = document.getElementById('itemInput');
        this.addButton = document.getElementById('addButton');
        this.shoppingList = document.getElementById('shoppingList');
        this.totalCount = document.getElementById('totalCount');
        this.completedCount = document.getElementById('completedCount');
        this.remainingCount = document.getElementById('remainingCount');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedButton = document.getElementById('clearCompleted');
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 항목 추가
        this.addButton.addEventListener('click', () => this.addItem());
        this.itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // 필터 버튼
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // 완료된 항목 삭제
        this.clearCompletedButton.addEventListener('click', () => this.clearCompletedItems());
    }

    // Supabase에서 데이터 불러오기
    async loadFromSupabase() {
        if (!supabase) {
            this.loadFromLocalStorageAsFallback();
            return;
        }

        try {
            this.items = await this.getAllItemsFromSupabase();
            this.render();
            
            // 로컬 스토리지에 백업 데이터가 있으면 Supabase로 마이그레이션
            const savedItems = localStorage.getItem('shoppingListItems');
            if (savedItems && savedItems.length > 2) { // 빈 배열이 아닌지 확인
                const localItems = JSON.parse(savedItems);
                if (localItems.length > 0) {
                    await this.migrateFromLocalStorage(localItems);
                    localStorage.removeItem('shoppingListItems'); // 마이그레이션 후 로컬 스토리지 삭제
                    this.items = await this.getAllItemsFromSupabase();
                    this.render();
                    this.showNotification('로컬 데이터가 Supabase로 마이그레이션되었습니다!', 'success');
                }
            }
        } catch (error) {
            console.error('Supabase에서 데이터를 불러오는 중 오류 발생:', error);
            // 오류 발생 시 로컬 스토리지에서 데이터 로드
            this.loadFromLocalStorageAsFallback();
        }
    }

    // 로컬 스토리지에서 데이터 불러오기 (폴백)
    loadFromLocalStorageAsFallback() {
        const savedItems = localStorage.getItem('shoppingListItems');
        this.items = savedItems ? JSON.parse(savedItems) : [];
        this.render();
        this.showNotification('Supabase 연결 실패, 로컬 스토리지 사용 중', 'error');
    }

    // Supabase에 데이터 저장
    async saveToSupabase() {
        // 항목별로 Supabase에 저장
    }

    // 항목 추가
    async addItem() {
        const text = this.itemInput.value.trim();
        
        if (!text) {
            this.showNotification('항목을 입력해주세요!', 'error');
            return;
        }

        const newItem = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Supabase에 항목 추가
        const addedItem = await this.addItemToSupabase(newItem);
        
        if (addedItem) {
            this.items.push(addedItem);
            this.render();
            
            this.itemInput.value = '';
            this.itemInput.focus();
            
            this.showNotification('항목이 추가되었습니다!', 'success');
        } else {
            // Supabase 실패 시 로컬에 저장
            this.items.push(newItem);
            localStorage.setItem('shoppingListItems', JSON.stringify(this.items));
            this.render();
            
            this.itemInput.value = '';
            this.itemInput.focus();
            
            this.showNotification('항목이 추가되었습니다! (로컬 저장)', 'info');
        }
    }

    // 항목 삭제
    async deleteItem(id) {
        // Supabase에서 항목 삭제
        const success = await this.deleteItemFromSupabase(id);
        
        if (success) {
            this.items = this.items.filter(item => item.id !== id);
            this.render();
            this.showNotification('항목이 삭제되었습니다!', 'info');
        } else {
            // Supabase 실패 시 로컬에서 삭제
            this.items = this.items.filter(item => item.id !== id);
            localStorage.setItem('shoppingListItems', JSON.stringify(this.items));
            this.render();
            this.showNotification('항목이 삭제되었습니다! (로컬)', 'info');
        }
    }

    // 항목 완료 상태 토글
    async toggleItemCompletion(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            const newCompletedState = !item.completed;
            
            // Supabase에서 항목 상태 업데이트
            const success = await this.updateItemCompletionInSupabase(id, newCompletedState);
            
            if (success) {
                item.completed = newCompletedState;
                this.render();
                
                const message = item.completed ? '구매 완료!' : '구매 예정으로 변경';
                this.showNotification(message, 'success');
            } else {
                // Supabase 실패 시 로컬에서 업데이트
                item.completed = newCompletedState;
                localStorage.setItem('shoppingListItems', JSON.stringify(this.items));
                this.render();
                
                const message = item.completed ? '구매 완료! (로컬)' : '구매 예정으로 변경 (로컬)';
                this.showNotification(message, 'info');
            }
        }
    }

    // 완료된 항목 모두 삭제
    async clearCompletedItems() {
        const completedCount = this.items.filter(item => item.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('삭제할 완료된 항목이 없습니다.', 'info');
            return;
        }

        if (confirm(`${completedCount}개의 완료된 항목을 삭제하시겠습니까?`)) {
            // Supabase에서 완료된 항목 삭제
            const success = await this.deleteCompletedItemsFromSupabase();
            
            if (success) {
                this.items = this.items.filter(item => !item.completed);
                this.render();
                this.showNotification(`${completedCount}개의 항목이 삭제되었습니다!`, 'success');
            } else {
                // Supabase 실패 시 로컬에서 삭제
                this.items = this.items.filter(item => !item.completed);
                localStorage.setItem('shoppingListItems', JSON.stringify(this.items));
                this.render();
                this.showNotification(`${completedCount}개의 항목이 삭제되었습니다! (로컬)`, 'info');
            }
        }
    }

    // 필터 설정
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 업데이트
        this.filterButtons.forEach(button => {
            if (button.dataset.filter === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        this.render();
    }

    // 필터링된 항목 가져오기
    getFilteredItems() {
        switch (this.currentFilter) {
            case 'active':
                return this.items.filter(item => !item.completed);
            case 'completed':
                return this.items.filter(item => item.completed);
            default:
                return this.items;
        }
    }

    // 통계 업데이트
    updateStats() {
        const total = this.items.length;
        const completed = this.items.filter(item => item.completed).length;
        const remaining = total - completed;

        this.totalCount.textContent = total;
        this.completedCount.textContent = completed;
        this.remainingCount.textContent = remaining;
    }

    // 항목 렌더링
    renderItem(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'shopping-item';
        itemElement.dataset.id = item.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'item-checkbox';
        checkbox.checked = item.completed;
        checkbox.addEventListener('change', () => this.toggleItemCompletion(item.id));

        const content = document.createElement('div');
        content.className = `item-content ${item.completed ? 'completed' : ''}`;
        content.textContent = item.text;

        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'item-action-btn delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.title = '삭제';
        deleteButton.addEventListener('click', () => this.deleteItem(item.id));

        actions.appendChild(deleteButton);
        
        itemElement.appendChild(checkbox);
        itemElement.appendChild(content);
        itemElement.appendChild(actions);

        return itemElement;
    }

    // 전체 렌더링
    render() {
        this.updateStats();
        
        const filteredItems = this.getFilteredItems();
        
        if (filteredItems.length === 0) {
            let message = '';
            switch (this.currentFilter) {
                case 'active':
                    message = '구매 예정인 항목이 없습니다.';
                    break;
                case 'completed':
                    message = '구매 완료된 항목이 없습니다.';
                    break;
                default:
                    message = '쇼핑 리스트가 비어있습니다.';
            }
            
            this.shoppingList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>${message}</p>
                    <p class="empty-hint">위의 입력창에 물품을 추가해보세요!</p>
                </div>
            `;
        } else {
            this.shoppingList.innerHTML = '';
            filteredItems.forEach(item => {
                this.shoppingList.appendChild(this.renderItem(item));
            });
        }
    }

    // 알림 표시
    showNotification(message, type) {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .notification-success {
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
            }
            
            .notification-error {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            }
            
            .notification-info {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // 3초 후 알림 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Supabase 관련 메서드들
    
    // 모든 항목 가져오기
    async getAllItemsFromSupabase() {
        if (!supabase) return [];
        
        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('항목을 가져오는 중 오류 발생:', error);
                return [];
            }

            return data.map(item => ({
                id: item.id,
                text: item.text,
                completed: item.completed,
                createdAt: item.created_at
            }));
        } catch (error) {
            console.error('항목을 가져오는 중 예외 발생:', error);
            return [];
        }
    }

    // 항목 추가
    async addItemToSupabase(item) {
        if (!supabase) return null;
        
        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .insert({
                    id: item.id,
                    text: item.text,
                    completed: item.completed,
                    created_at: item.createdAt
                })
                .select()
                .single();

            if (error) {
                console.error('항목 추가 중 오류 발생:', error);
                return null;
            }

            return {
                id: data.id,
                text: data.text,
                completed: data.completed,
                createdAt: data.created_at
            };
        } catch (error) {
            console.error('항목 추가 중 예외 발생:', error);
            return null;
        }
    }

    // 항목 삭제
    async deleteItemFromSupabase(id) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('shopping_items')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('항목 삭제 중 오류 발생:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('항목 삭제 중 예외 발생:', error);
            return false;
        }
    }

    // 항목 완료 상태 업데이트
    async updateItemCompletionInSupabase(id, completed) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('shopping_items')
                .update({ completed })
                .eq('id', id);

            if (error) {
                console.error('항목 업데이트 중 오류 발생:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('항목 업데이트 중 예외 발생:', error);
            return false;
        }
    }

    // 완료된 항목 모두 삭제
    async deleteCompletedItemsFromSupabase() {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('shopping_items')
                .delete()
                .eq('completed', true);

            if (error) {
                console.error('완료된 항목 삭제 중 오류 발생:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('완료된 항목 삭제 중 예외 발생:', error);
            return false;
        }
    }

    // 로컬 스토리지 데이터를 Supabase로 마이그레이션
    async migrateFromLocalStorage(localItems) {
        if (!supabase) return false;
        
        try {
            // 기존 데이터 삭제 (선택사항)
            const { error: deleteError } = await supabase
                .from('shopping_items')
                .delete()
                .neq('id', 0); // 모든 항목 삭제

            if (deleteError) {
                console.error('기존 데이터 삭제 중 오류 발생:', deleteError);
            }

            // 새 데이터 삽입
            const itemsToInsert = localItems.map(item => ({
                id: item.id,
                text: item.text,
                completed: item.completed,
                created_at: item.createdAt || new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('shopping_items')
                .insert(itemsToInsert);

            if (insertError) {
                console.error('데이터 마이그레이션 중 오류 발생:', insertError);
                return false;
            }

            return true;
        } catch (error) {
            console.error('데이터 마이그레이션 중 예외 발생:', error);
            return false;
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
    const app = new ShoppingListApp();
    
    // 앱이 로드된 후 샘플 데이터 확인 (비동기로 처리)
    setTimeout(async () => {
        if (app.items.length === 0) {
            // Supabase에서 데이터가 없는지 확인
            const items = await app.getAllItemsFromSupabase();
            if (items.length === 0) {
                const sampleItems = [
                    { id: Date.now() + 1, text: '사과', completed: false, createdAt: new Date().toISOString() },
                    { id: Date.now() + 2, text: '우유', completed: true, createdAt: new Date().toISOString() },
                    { id: Date.now() + 3, text: '빵', completed: false, createdAt: new Date().toISOString() },
                    { id: Date.now() + 4, text: '계란', completed: false, createdAt: new Date().toISOString() },
                    { id: Date.now() + 5, text: '채소', completed: false, createdAt: new Date().toISOString() }
                ];
                
                // 샘플 데이터를 Supabase에 추가
                for (const item of sampleItems) {
                    await app.addItemToSupabase(item);
                }
                
                // 앱 다시 로드
                app.items = await app.getAllItemsFromSupabase();
                app.render();
                app.showNotification('샘플 데이터가 추가되었습니다!', 'info');
            }
        }
    }, 1000); // 1초 후에 실행하여 앱 초기화 완료 보장
});
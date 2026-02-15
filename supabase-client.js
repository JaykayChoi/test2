// Supabase 데이터베이스 클라이언트
const { supabase } = require('./supabase-config');

class SupabaseClient {
  constructor() {
    this.supabase = supabase;
  }

  // 모든 항목 가져오기
  async getAllItems() {
    try {
      const { data, error } = await this.supabase
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
  async addItem(item) {
    try {
      const { data, error } = await this.supabase
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
  async deleteItem(id) {
    try {
      const { error } = await this.supabase
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
  async updateItemCompletion(id, completed) {
    try {
      const { error } = await this.supabase
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
  async deleteCompletedItems() {
    try {
      const { error } = await this.supabase
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
    try {
      // 기존 데이터 삭제 (선택사항)
      const { error: deleteError } = await this.supabase
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

      const { error: insertError } = await this.supabase
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

module.exports = new SupabaseClient();
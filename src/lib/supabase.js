import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://kxnsgrytvigymczwaay.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4bnNncnl0dmlneW1zenp3YWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDcwMzYsImV4cCI6MjEwMzY4MzAzNn0.7g_8-UPfEkgQUUFKspEVHbYZas5orHR5qWqwYbLytEQ';

export const realSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_KEYS = {
  store_settings: 'ARADHANA_DB_store_settings',
  hardik_rates: 'ARADHANA_DB_rates',
  custom_users: 'ARADHANA_DB_users',
  harvest_schemes: 'ARADHANA_DB_schemes',
  payments: 'ARADHANA_DB_payments',
  hardik_products: 'ARADHANA_DB_products',
  storage_files: 'ARADHANA_DB_storage'
};

function initDefaults() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.store_settings)) {
    localStorage.setItem(STORAGE_KEYS.store_settings, JSON.stringify([
      { id: 1, upi_id: '7202921222@okbizaxis', qr_code_url: '/assets/logo_badge.png' }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.hardik_rates)) {
    localStorage.setItem(STORAGE_KEYS.hardik_rates, JSON.stringify([
      { id: 1, gold24k: 7350, gold22k: 6737, silver1kg: 85500, updated_at: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.custom_users)) {
    localStorage.setItem(STORAGE_KEYS.custom_users, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.harvest_schemes)) {
    localStorage.setItem(STORAGE_KEYS.harvest_schemes, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.payments)) {
    localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.hardik_products)) {
    localStorage.setItem(STORAGE_KEYS.hardik_products, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.storage_files)) {
    localStorage.setItem(STORAGE_KEYS.storage_files, JSON.stringify({}));
  }
}

initDefaults();

function getTable(tableName) {
  try {
    const key = STORAGE_KEYS[tableName] || `ARADHANA_DB_${tableName}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setTable(tableName, items) {
  const key = STORAGE_KEYS[tableName] || `ARADHANA_DB_${tableName}`;
  localStorage.setItem(key, JSON.stringify(items));
}

class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orders = [];
    this.isSingle = false;
    this.selectFields = '*';
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(field, value) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orders.push({ field, ascending });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async executeQuery() {
    let data = getTable(this.tableName);

    for (const filter of this.filters) {
      if (filter.op === 'eq') {
        data = data.filter(item => String(item[filter.field]) === String(filter.value));
      }
    }

    for (const order of this.orders) {
      data.sort((a, b) => {
        if (a[order.field] < b[order.field]) return order.ascending ? -1 : 1;
        if (a[order.field] > b[order.field]) return order.ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.tableName === 'harvest_schemes') {
      const users = getTable('custom_users');
      const payments = getTable('payments');
      data = data.map(scheme => ({
        ...scheme,
        custom_users: users.find(u => String(u.id) === String(scheme.user_id)) || null,
        payments: payments.filter(p => String(p.scheme_id) === String(scheme.id))
      }));
    }

    if (this.isSingle) {
      return { data: data[0] || null, error: data.length === 0 ? new Error('Not found') : null };
    }

    return { data, error: null };
  }

  then(onfulfilled, onrejected) {
    return this.executeQuery().then(onfulfilled, onrejected);
  }

  async insert(rows) {
    const table = getTable(this.tableName);
    const newItems = rows.map(row => ({
      id: row.id || `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      start_date: new Date().toISOString(),
      payment_date: new Date().toISOString(),
      ...row
    }));

    if (this.tableName === 'custom_users') {
      for (const item of newItems) {
        if (table.some(u => u.email === item.email)) {
          return { data: null, error: { code: '23505', message: 'Email already registered.' } };
        }
      }
    }

    table.push(...newItems);
    setTable(this.tableName, table);

    const resultData = this.isSingle ? newItems[0] : newItems;

    return {
      data: resultData,
      error: null,
      select: () => ({
        single: () => ({ data: newItems[0], error: null })
      })
    };
  }

  async update(updates) {
    let table = getTable(this.tableName);

    table = table.map(item => {
      let matches = true;
      for (const filter of this.filters) {
        if (filter.op === 'eq' && String(item[filter.field]) !== String(filter.value)) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return { ...item, ...updates };
      }
      return item;
    });

    setTable(this.tableName, table);
    return { data: null, error: null };
  }

  async delete() {
    let table = getTable(this.tableName);
    table = table.filter(item => {
      for (const filter of this.filters) {
        if (filter.op === 'eq' && String(item[filter.field]) === String(filter.value)) {
          return false;
        }
      }
      return true;
    });
    setTable(this.tableName, table);
    return { data: null, error: null };
  }
}

const storageClient = {
  from(bucketName) {
    return {
      async download(fileName) {
        try {
          const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.storage_files) || '{}');
          const fileData = files[`${bucketName}/${fileName}`];
          if (fileData) {
            return { data: fileData, error: null };
          }
          return { data: null, error: new Error('File not found') };
        } catch (e) {
          return { data: null, error: e };
        }
      },
      async upload(fileName, file, options = {}) {
        try {
          const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.storage_files) || '{}');
          let url = '';
          if (typeof file === 'string') {
            url = file;
          } else if (file && (file instanceof Blob || file instanceof File)) {
            url = URL.createObjectURL(file);
          }
          files[`${bucketName}/${fileName}`] = url;
          localStorage.setItem(STORAGE_KEYS.storage_files, JSON.stringify(files));
          return { data: { path: fileName }, error: null };
        } catch (e) {
          return { data: null, error: e };
        }
      },
      getPublicUrl(filePath) {
        try {
          const files = JSON.parse(localStorage.getItem(STORAGE_KEYS.storage_files) || '{}');
          const savedUrl = files[`${bucketName}/${filePath}`];
          return { data: { publicUrl: savedUrl || `/assets/${filePath}` } };
        } catch (e) {
          return { data: { publicUrl: `/assets/${filePath}` } };
        }
      }
    };
  }
};

export const supabase = {
  from(tableName) {
    return new QueryBuilder(tableName);
  },
  storage: storageClient
};

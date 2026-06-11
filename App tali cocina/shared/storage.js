const Storage = {
  getRecipes() {
    return JSON.parse(localStorage.getItem('tc_recipes') || '[]');
  },

  saveRecipes(data) {
    localStorage.setItem('tc_recipes', JSON.stringify(data));
  },

  getPromos() {
    return JSON.parse(localStorage.getItem('tc_promos') || '[]');
  },

  savePromos(data) {
    localStorage.setItem('tc_promos', JSON.stringify(data));
  },

  getUsers() {
    return JSON.parse(localStorage.getItem('tc_users') || '[]');
  },

  saveUsers(data) {
    localStorage.setItem('tc_users', JSON.stringify(data));
  }
};
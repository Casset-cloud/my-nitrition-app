// Global data storage
let appData = {
    meals: [],
    programStartDate: null
};

// Initialize app
function initApp() {
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = today;
    
    // Set program start date (30 days ago)
    appData.programStartDate = new Date();
    appData.programStartDate.setDate(appData.programStartDate.getDate() - 30);
    
    // Create initial 6 meals
    for (let i = 0; i < 6; i++) {
        addMeal();
    }
    
    // Calculate initial day of program
    calculateDayOfProgram();
    
    // Add event listeners
    document.getElementById('data').addEventListener('change', calculateDayOfProgram);
    
    // Add input change listeners for all form fields to auto-save state
    addGlobalEventListeners();
}

// Add global event listeners
function addGlobalEventListeners() {
    // Listen for changes on all inputs to maintain state
    document.addEventListener('input', function(e) {
        if (e.target.matches('input, select')) {
            // Auto-save functionality can be added here if needed
        }
    });
}

// Calculate day of program based on start date
function calculateDayOfProgram() {
    const currentDate = new Date(document.getElementById('data').value);
    const startDate = appData.programStartDate;
    
    if (currentDate && startDate) {
        const diffTime = currentDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        document.getElementById('denProgrammy').value = Math.max(1, diffDays);
    }
}

// Add a new meal
function addMeal() {
    const mealIndex = appData.meals.length;
    const meal = {
        id: mealIndex,
        dishes: []
    };
    
    // Add 6 initial dishes
    for (let i = 0; i < 6; i++) {
        meal.dishes.push({ name: '', mass: 0, calories: 0 });
    }
    
    appData.meals.push(meal);
    renderMeals();
}

// Remove a meal
function removeMeal(mealIndex) {
    if (appData.meals.length > 1) {
        appData.meals.splice(mealIndex, 1);
        // Reindex meals
        appData.meals.forEach((meal, index) => {
            meal.id = index;
        });
        renderMeals();
    }
}

// Add dish to meal
function addDish(mealIndex) {
    appData.meals[mealIndex].dishes.push({ name: '', mass: 0, calories: 0 });
    renderMeals();
}

// Remove dish from meal
function removeDish(mealIndex, dishIndex) {
    if (appData.meals[mealIndex].dishes.length > 1) {
        appData.meals[mealIndex].dishes.splice(dishIndex, 1);
        renderMeals();
    }
}

// Update dish data
function updateDish(mealIndex, dishIndex, field, value) {
    if (appData.meals[mealIndex] && appData.meals[mealIndex].dishes[dishIndex]) {
        appData.meals[mealIndex].dishes[dishIndex][field] = value;
        calculateMealStats(mealIndex);
    }
}

// Calculate meal statistics
function calculateMealStats(mealIndex) {
    const meal = appData.meals[mealIndex];
    if (!meal) return;
    
    let totalMass = 0;
    let totalCalories = 0;
    
    meal.dishes.forEach(dish => {
        totalMass += parseFloat(dish.mass) || 0;
        totalCalories += parseFloat(dish.calories) || 0;
    });
    
    const density = totalMass > 0 ? (totalCalories / totalMass).toFixed(2) : '0.00';
    
    // Update display
    const massElement = document.getElementById(`meal-mass-${mealIndex}`);
    const caloriesElement = document.getElementById(`meal-calories-${mealIndex}`);
    const densityElement = document.getElementById(`meal-density-${mealIndex}`);
    
    if (massElement) massElement.textContent = totalMass.toFixed(1);
    if (caloriesElement) caloriesElement.textContent = totalCalories.toFixed(0);
    if (densityElement) densityElement.textContent = density;
}

// Render all meals
function renderMeals() {
    const container = document.getElementById('mealsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    appData.meals.forEach((meal, mealIndex) => {
        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal';
        mealDiv.innerHTML = `
            <div class="meal-header">
                <h3 class="meal-title">Приём пищи ${mealIndex + 1}</h3>
                <div class="meal-controls">
                    <button class="btn btn--secondary btn--sm" onclick="addDish(${mealIndex})">
                        Добавить блюдо
                    </button>
                    <button class="btn btn--danger btn--sm" onclick="removeMeal(${mealIndex})" 
                            ${appData.meals.length <= 1 ? 'disabled' : ''}>
                        Удалить приём
                    </button>
                </div>
            </div>
            
            <div class="dishes-container" id="dishes-${mealIndex}">
                <!-- Dishes will be rendered here -->
            </div>
            
            <div class="meal-stats">
                <div class="stat-card">
                    <div class="stat-value" id="meal-mass-${mealIndex}">0.0</div>
                    <div class="stat-label">Общая масса (г)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="meal-calories-${mealIndex}">0</div>
                    <div class="stat-label">Калории (ккал)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="meal-density-${mealIndex}">0.00</div>
                    <div class="stat-label">Плотность (ккал/г)</div>
                </div>
            </div>
        `;
        
        container.appendChild(mealDiv);
        renderDishes(mealIndex);
        calculateMealStats(mealIndex);
    });
}

// Render dishes for a specific meal
function renderDishes(mealIndex) {
    const dishesContainer = document.getElementById(`dishes-${mealIndex}`);
    if (!dishesContainer || !appData.meals[mealIndex]) return;
    
    dishesContainer.innerHTML = '';
    
    appData.meals[mealIndex].dishes.forEach((dish, dishIndex) => {
        const dishDiv = document.createElement('div');
        dishDiv.className = 'dish';
        dishDiv.innerHTML = `
            <div class="dish-field">
                <label class="label">Название блюда</label>
                <input type="text" class="input" 
                       value="${dish.name || ''}" 
                       placeholder="Например: Куриная грудка"
                       onchange="updateDish(${mealIndex}, ${dishIndex}, 'name', this.value)">
            </div>
            
            <div class="dish-field">
                <label class="label">Масса (г)</label>
                <input type="number" class="input" 
                       value="${dish.mass || ''}" 
                       step="0.1" 
                       min="0"
                       placeholder="0.0"
                       onchange="updateDish(${mealIndex}, ${dishIndex}, 'mass', this.value)">
            </div>
            
            <div class="dish-field">
                <label class="label">Калории (ккал)</label>
                <input type="number" class="input" 
                       value="${dish.calories || ''}" 
                       step="1" 
                       min="0"
                       placeholder="0"
                       onchange="updateDish(${mealIndex}, ${dishIndex}, 'calories', this.value)">
            </div>
            
            <div class="dish-field">
                <button class="btn btn--danger dish-remove" 
                        onclick="removeDish(${mealIndex}, ${dishIndex})" 
                        ${appData.meals[mealIndex].dishes.length <= 1 ? 'disabled' : ''}
                        title="Удалить блюдо">
                    ×
                </button>
            </div>
        `;
        
        dishesContainer.appendChild(dishDiv);
    });
}

// Get meal name based on index
function getMealName(index) {
    const mealNames = [
        'Завтрак',
        'Перекус 1',
        'Обед', 
        'Перекус 2',
        'Ужин',
        'Поздний перекус'
    ];
    
    return mealNames[index] || `Приём пищи ${index + 1}`;
}

// Export data (could be useful for future features)
function exportData() {
    const data = {
        parameters: {
            etap: document.getElementById('etap').value,
            data: document.getElementById('data').value,
            denProgrammy: document.getElementById('denProgrammy').value,
            vremyaPodema: document.getElementById('vremyaPodema').value,
            nastroiNaSnijenie: document.getElementById('nastroiNaSnijenie').checked,
            sbroshenoTotal: document.getElementById('sbroshenoTotal').value,
            sbroshenoZa7: document.getElementById('sbroshenoZa7').value,
            oteki: document.getElementById('oteki').value,
            denCikla: document.getElementById('denCikla').value,
            stul: document.getElementById('stul').value,
            polivitaminy: document.getElementById('polivitaminy').checked,
            malso: document.getElementById('malso').checked,
            otrubi: document.getElementById('otrubi').checked
        },
        meals: appData.meals
    };
    
    return JSON.stringify(data, null, 2);
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Add some helpful utility functions
window.nutritionApp = {
    exportData,
    addMeal,
    removeMeal,
    addDish,
    removeDish,
    calculateMealStats
};
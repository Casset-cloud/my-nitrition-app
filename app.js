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

    // Set default program start date (today)
    const defaultStartDate = new Date().toISOString().split('T')[0];
    document.getElementById('dataNachala').value = defaultStartDate;
    appData.programStartDate = new Date(defaultStartDate);

    // Create initial 6 meals
    for (let i = 0; i < 6; i++) {
        addMeal();
    }

    // Calculate initial day of program
    calculateDayOfProgram();

    // Add event listeners
    document.getElementById('data').addEventListener('change', function() {
        calculateDayOfProgram();
        calculateDailyTotal();
    });

    document.getElementById('dataNachala').addEventListener('change', function() {
        const startDateValue = document.getElementById('dataNachala').value;
        if (startDateValue) {
            appData.programStartDate = new Date(startDateValue);
            calculateDayOfProgram();
        }
    });

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
    const currentDateValue = document.getElementById('data').value;
    const startDateValue = document.getElementById('dataNachala').value;

    if (currentDateValue && startDateValue) {
        const currentDate = new Date(currentDateValue);
        const startDate = new Date(startDateValue);

        const diffTime = currentDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 чтобы первый день был 1

        document.getElementById('denProgrammy').value = Math.max(1, diffDays);
    }
}

// Calculate daily total statistics
function calculateDailyTotal() {
    let totalMass = 0;
    let totalCalories = 0;

    appData.meals.forEach(meal => {
        meal.dishes.forEach(dish => {
            totalMass += parseFloat(dish.mass) || 0;
            totalCalories += parseFloat(dish.calories) || 0;
        });
    });

    const totalDensity = totalMass > 0 ? (totalCalories / totalMass).toFixed(2) : '0.00';

    // Update display
    document.getElementById('totalMass').textContent = totalMass.toFixed(1);
    document.getElementById('totalCalories').textContent = totalCalories.toFixed(0);
    document.getElementById('totalDensity').textContent = totalDensity;
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
        meal.dishes.push({
            name: '',
            mass: 0,
            calories: 0
        });
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
        calculateDailyTotal();
    }
}

// Add dish to meal
function addDish(mealIndex) {
    appData.meals[mealIndex].dishes.push({
        name: '',
        mass: 0,
        calories: 0
    });
    renderMeals();
}

// Remove dish from meal
function removeDish(mealIndex, dishIndex) {
    if (appData.meals[mealIndex].dishes.length > 1) {
        appData.meals[mealIndex].dishes.splice(dishIndex, 1);
        renderMeals();
        calculateMealStats(mealIndex);
        calculateDailyTotal();
    }
}

// Update dish data
function updateDish(mealIndex, dishIndex, field, value) {
    if (appData.meals[mealIndex] && appData.meals[mealIndex].dishes[dishIndex]) {
        appData.meals[mealIndex].dishes[dishIndex][field] = value;
        calculateMealStats(mealIndex);
        calculateDailyTotal();
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
            <div style="background-color: var(--color-bg-${(mealIndex % 8) + 1}); padding: 16px; border-radius: var(--radius-lg); margin-bottom: 16px; border: 1px solid var(--color-card-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0;">Приём пищи ${mealIndex + 1}</h3>
                    <button class="btn btn--sm btn--secondary" onclick="removeMeal(${mealIndex})">Удалить</button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-bottom: 12px;">
                    ${meal.dishes.map((dish, dishIndex) => `
                        <div style="background-color: var(--color-surface); padding: 12px; border-radius: var(--radius-base); border: 1px solid var(--color-card-border-inner);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-weight: 500; font-size: 13px;">Блюдо ${dishIndex + 1}</span>
                                ${meal.dishes.length > 1 ? `<button class="btn btn--sm" style="padding: 2px 8px; font-size: 11px;" onclick="removeDish(${mealIndex}, ${dishIndex})">×</button>` : ''}
                            </div>
                            <input 
                                type="text" 
                                class="form-control" 
                                placeholder="Название блюда" 
                                value="${dish.name}"
                                oninput="updateDish(${mealIndex}, ${dishIndex}, 'name', this.value)"
                                style="margin-bottom: 8px; font-size: 13px; padding: 6px 10px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                <input 
                                    type="number" 
                                    class="form-control" 
                                    placeholder="Масса (г)" 
                                    value="${dish.mass || ''}"
                                    oninput="updateDish(${mealIndex}, ${dishIndex}, 'mass', this.value)"
                                    style="font-size: 13px; padding: 6px 10px;">
                                <input 
                                    type="number" 
                                    class="form-control" 
                                    placeholder="Калории" 
                                    value="${dish.calories || ''}"
                                    oninput="updateDish(${mealIndex}, ${dishIndex}, 'calories', this.value)"
                                    style="font-size: 13px; padding: 6px 10px;">
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="btn btn--sm btn--secondary" onclick="addDish(${mealIndex})" style="margin-bottom: 12px;">Добавить блюдо</button>

                <div style="display: flex; gap: 16px; padding: 12px; background-color: var(--color-surface); border-radius: var(--radius-base); border: 1px solid var(--color-card-border-inner);">
                    <div>
                        <span style="font-size: 12px; color: var(--color-text-secondary);">Масса:</span>
                        <span style="font-weight: 600; margin-left: 4px;"><span id="meal-mass-${mealIndex}">0.0</span> г</span>
                    </div>
                    <div>
                        <span style="font-size: 12px; color: var(--color-text-secondary);">Калории:</span>
                        <span style="font-weight: 600; margin-left: 4px;"><span id="meal-calories-${mealIndex}">0</span> к/кал</span>
                    </div>
                    <div>
                        <span style="font-size: 12px; color: var(--color-text-secondary);">Плотность:</span>
                        <span style="font-weight: 600; margin-left: 4px;"><span id="meal-density-${mealIndex}">0.00</span></span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(mealDiv);

        // Calculate stats for this meal
        calculateMealStats(mealIndex);
    });

    // Calculate daily total
    calculateDailyTotal();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

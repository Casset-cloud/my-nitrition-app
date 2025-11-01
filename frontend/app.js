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

    // Add input change listeners for all form fields
    addGlobalEventListeners();
}

// Add global event listeners
function addGlobalEventListeners() {
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
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

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
    renderDishes(mealIndex);
    calculateMealStats(mealIndex);
    calculateDailyTotal();
}

// Remove dish from meal
function removeDish(mealIndex, dishIndex) {
    if (appData.meals[mealIndex].dishes.length > 1) {
        appData.meals[mealIndex].dishes.splice(dishIndex, 1);
        renderDishes(mealIndex);
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
        const mealTemplate = document.getElementById('mealTemplate');
        const mealClone = mealTemplate.content.cloneNode(true);

        // Update meal number
        const mealTitle = mealClone.querySelector('.meal-title');
        mealTitle.textContent = `Приём пищи ${mealIndex + 1}`;

        // Set meal index for buttons
        const addDishBtn = mealClone.querySelector('.add-dish-btn');
        addDishBtn.setAttribute('onclick', `addDish(${mealIndex})`);

        const removeMealBtn = mealClone.querySelector('.remove-meal-btn');
        removeMealBtn.setAttribute('onclick', `removeMeal(${mealIndex})`);
        if (appData.meals.length <= 1) {
            removeMealBtn.disabled = true;
        }

        // Set container ID
        const dishesContainer = mealClone.querySelector('.dishes-container');
        dishesContainer.id = `dishes-${mealIndex}`;

        // Set stats IDs
        const massValue = mealClone.querySelector('.meal-mass-value');
        massValue.id = `meal-mass-${mealIndex}`;

        const caloriesValue = mealClone.querySelector('.meal-calories-value');
        caloriesValue.id = `meal-calories-${mealIndex}`;

        const densityValue = mealClone.querySelector('.meal-density-value');
        densityValue.id = `meal-density-${mealIndex}`;

        container.appendChild(mealClone);
        renderDishes(mealIndex);
        calculateMealStats(mealIndex);
    });

    calculateDailyTotal();
}

// Render dishes for a specific meal
function renderDishes(mealIndex) {
    const dishesContainer = document.getElementById(`dishes-${mealIndex}`);
    if (!dishesContainer || !appData.meals[mealIndex]) return;

    dishesContainer.innerHTML = '';

    appData.meals[mealIndex].dishes.forEach((dish, dishIndex) => {
        const dishTemplate = document.getElementById('dishTemplate');
        const dishClone = dishTemplate.content.cloneNode(true);

        // Set dish name input
        const nameInput = dishClone.querySelector('.dish-name-input');
        nameInput.value = dish.name || '';
        nameInput.setAttribute('onchange', `updateDish(${mealIndex}, ${dishIndex}, 'name', this.value)`);

        // Set dish mass input
        const massInput = dishClone.querySelector('.dish-mass-input');
        massInput.value = dish.mass || '';
        massInput.setAttribute('onchange', `updateDish(${mealIndex}, ${dishIndex}, 'mass', this.value)`);

        // Set dish calories input
        const caloriesInput = dishClone.querySelector('.dish-calories-input');
        caloriesInput.value = dish.calories || '';
        caloriesInput.setAttribute('onchange', `updateDish(${mealIndex}, ${dishIndex}, 'calories', this.value)`);

        // Set remove button
        const removeBtn = dishClone.querySelector('.remove-dish-btn');
        removeBtn.setAttribute('onclick', `removeDish(${mealIndex}, ${dishIndex})`);
        if (appData.meals[mealIndex].dishes.length <= 1) {
            removeBtn.disabled = true;
        }

        dishesContainer.appendChild(dishClone);
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

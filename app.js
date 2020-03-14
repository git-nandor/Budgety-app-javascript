//IIFE Module

//Budget Controller
var budgetController = (function() {

    //Expense Constructor
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };
    
    Expense.prototype.calcPercentage = function(totalIncome) {
        
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        }else {
            this.percentage = -1;
        };
    };
    
    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };
    
    //Income Constructor
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
    //Stored and categorized all data here
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1 // -1 Sign to don't exist at this point
    };
    
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(current, index, array) {
           sum = sum + current.value; 
        });
        data.totals[type] = sum;
    };

    //Public method for allow other modules to add new item into data structure
    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            //ID = last element id + 1 (deleting safe)
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }else {
                ID = 0;   
            };
            
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            }else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }else {
                alert('Not valid type of newItem! Expect exp/inc!');
            };
                
            //Store new data object depending on the type (same naming exp/inc in data object)
            data.allItems[type].push(newItem);
            
            //Make newItem public for other modules
            return newItem;
        },
        
        deleteItem: function(type, ID) {
            var type = type.substring(0, 3);
            
            data.allItems[type].forEach(function(current, index, array){
                if (current.id == ID) {
                    data.allItems[type].splice(index, 1);
                    };
            });
        },
        
        calculateBudget: function() {
            //Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            
            //Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;
            
            //Calculate the percentage of income that we spent ( the base value is income = 100% -> (expenses/income) * 100 )
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp/data.totals.inc) * 100);
            }else {
                data.percentage = -1;
            };
        },
        
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },
        
        calculatePercentages: function() {
            
            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });
        },
        
        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            });
            return allPercentages;
        }
    };  
})();

//UI Controller read and display data
var UIController = (function() {

    //collection of all DOM elements
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        itemListContainer: '.container',
        itemDeleteIcon: '.ion-ios-close-outline',
        listItem: '.item',
        expensesPercentageLabel: '.item__percentage',
        dateLabel: '.budget__title--date'
    };
    
    // + or - before numbers, exactly 2 decimal points, comma separating the thousands (2310.4567 -> 2,310.46, 2000 -> 2,000.00)
    var formatNumber = function(number, type) {
        var numSplit, int, dec, type, part1, part2;
        
        number = Math.abs(number);
        number = number.toFixed(2);
        
        numSplit = number.split('.');
        int = numSplit[0];
        
        if (int.length > 3) {
            
            commas = Math.floor((int.length - 1) / 3);
            
            for (var i = 1; i <= commas; i++) {
                
                part1 = int.substr(0, int.length - ((i * 3) + (i - 1))) + ',';
                part2 = int.substr(int.length - ((i * 3) + (i - 1)), ((i * 3) + (i - 1)));
                int = part1 + part2;
            };
        };
            
        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };
    
    //Custom reusable forEach function for Node lists 
    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        };
    };
    
    //Public functions of UI Controller
    return{

        getDOMstrings: function() {
            return DOMstrings;
        },
        
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, //Returned value will be 'inc' or 'exp'
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },
        
        addListItem: function(obj, type) {
            var html, newHtml, element;
            
                //Create HTML string with placeholder text
                if (type === 'inc') {    
                    element = DOMstrings.incomeContainer;
                    html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
                }else if (type === 'exp') {
                    element = DOMstrings.expensesContainer;
                    html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';     
                };

                //Replace the placeholder with actual data
                newHtml = html.replace('%id%', obj.id);
                newHtml = newHtml.replace('%description%', obj.description);
                newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
                newHtml = newHtml.replace('%description%', obj.description);
            
                //Insert the HTML into the DOM
                document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },
        
        deleteListItem: function(listItem) {
            listItem.remove();
        },
    
        clearFields: function() {
            var fields, fieldsArray;
            
            //Build a list of fields from HTML element objects (Node list)
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            //Create an array from the fields list (Node list) with a hack of slice.call
            fieldsArray = Array.prototype.slice.call(fields);
            
            //Clear all fields
            fieldsArray.forEach(function(current, index, array){
                current.value = '';
            });
            
            //Set the focus back to the description field
            document.querySelector(DOMstrings.inputDescription).focus();
        },
        
        displayBudget: function(budgetObj){
            var type;
            
            if (budgetObj.budget === 0) {
                document.querySelector(DOMstrings.budgetLabel).textContent = '0.00';
            }else {    
                budgetObj.budget > 0 ? type = 'inc' : type = 'exp';
                document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(budgetObj.budget, type); 
            };
            
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(budgetObj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(budgetObj.totalExp, 'exp');
            
            if (budgetObj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = budgetObj.percentage + '%';
            }else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            };
        },
        
        displayPercentages: function(percentages) {
            
            //Build a Node list from fields
            var fields = document.querySelectorAll(DOMstrings.expensesPercentageLabel);
            
            //Iterate over the fields with the new nodeListForEach function and display the percentages
            nodeListForEach(fields, function(current, index) {
                
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                }else {
                    current.textContent = '---';
                };
            });
        },
        
        displayDate: function() {
            var now, splitDate, year, month, monthNames;
            
            now = new Date();
            
            year = now.getFullYear();
            monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            month = monthNames[now.getMonth()];
            
            document.querySelector(DOMstrings.dateLabel).textContent = year + ' ' + month;
        },
        
        changeInputType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            );
            
            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            });
            
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        }
    };
})();

//Global App Controller
var AppController = (function(budgetCtrl, UICtrl) {
    var DOM = UICtrl.getDOMstrings();
    
    //Collect all Event Listeners
    var setupEventListeners = function() {

        //When pressing the dedicated button
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        //When press Enter
        document.addEventListener('keypress', function(event) {
            //older browser safe version: which === 13 -> Enter
            if (event.keyCode === 13 || event.which === 13) {
                 ctrlAddItem();
            };    
        });
        
        //When pressing delete item (use event delegation because are'nt elements in the list yet) 
        document.querySelector(DOM.itemListContainer).addEventListener('click', ctrlDeleteItem); // addEventListener automatically send event object as parameter to the given function 
        
        //When input type changed
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeInputType);
    };
    
    var ctrlAddItem = function() {
        var input, newItem;
        
        //1. Get the field input data
        input = UICtrl.getInput();
        
        if (input.description !== "" && input.value !== 0 && !isNaN(input.value)){
        
            //2. Add the item to the budget controller
            newItem = budgetController.addItem(input.type, input.description, input.value);

            //3. Add the item to the UI
            UIController.addListItem(newItem, input.type);

            //4. Clear the input fields
            UIController.clearFields();

            //5. Calculate and update budget
            updateBudget();
            
            //6. Update percentages
            updatePercentages();
        };  
    };
    
    var ctrlDeleteItem = function (event) { //event object come from the addEventListener
        var listItem, listItemID, identifierArray, itemID, itemType, clickedElementClass;
        
        //1. Get the target element
        clickedElementClass = '.' + event.target.className;
        
        //2. Add the item to the budget controller for deleting
        if (clickedElementClass === DOM.itemDeleteIcon) {
            
            //Find the clicked icon parent list item and identify it
            listItem = event.target.closest(DOM.listItem);
            listItemID = listItem.id;
            identifierArray = listItemID.split("-");
            itemType = identifierArray[0];
            itemID = parseInt(identifierArray[1]);
            
            budgetController.deleteItem(itemType, itemID);
            
            //3. Delete item from the UI
            UICtrl.deleteListItem(listItem);
            
            //4. Update budget
            updateBudget();
            
            //5. Update percentages
            updatePercentages();
        };
    };
    
    var updateBudget = function(){
        //1. Calculate budget
        budgetCtrl.calculateBudget();
        
        //2. Get the new budget
        var budget = budgetCtrl.getBudget();
        
        //3. Display the new budget on the UI
        UICtrl.displayBudget(budget);
    };
    
    var updatePercentages = function() {
        
        //1. Calculate new percentages
        budgetCtrl.calculatePercentages();
        
        //2. Get all percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();
        
        //3. Update the UI with new percentages
        UICtrl.displayPercentages(percentages);
    };
    
    return {
        init: function() {
            
            UICtrl.displayDate();
            
            //Clear all fields
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            
            setupEventListeners();
        }
    };
    
//Parameters for appController
})(budgetController, UIController);

AppController.init();
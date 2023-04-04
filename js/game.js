/*
    Classes are currently grouped into the same .js file for ease of testing but will later be seperated
*/

class GameComponent {
    // Unique String identifier of the component
    #componentId;

    constructor(componentId) {
        if (this.constructor == GameComponent) {
            throw new Error("GameComponent is an abstract class and must be extended.");
        } else {
            this.#componentId = componentId;
        }
    }

    getId() {
        return(this.#componentId);
    }

    // An abstract method that requires implementation by a subclass
    getOutput() {
        throw new Error("Method 'getOutput()' must be implemented.");
    }
}

// Class that holds an unchanging boolean value
class StaticInput extends GameComponent {
    // Boolean input & output
    _state;

    constructor(componentId, state) {
        super(componentId);
        this._state = state;
    }

    getOutput() {
        return this._state;
    }
}

// Class that handles game elements affected by user input
class UserInput extends StaticInput {
    // TODO: link to an interactable element on creation
    // TODO: Extend StaticInput instead of GameComponent
    constructor(componentId) {
        super(componentId, false);
    }

    ToggleOutput() {
        this._state = this._state != true;
        return this._state;
    }
}

// Static factory class for creating logic gates based on a string identifier
class LogicGateFactory {
    constructor() {
        throw new Error("LogicGateFactory is static and cannot be initialized.")
    }

    static constructLogicGate(componentId, gateIdentifier) {
        switch (gateIdentifier.toLowerCase()) {
            case "not":
                return new NotGate(componentId);
            case "and":
                return new AndGate(componentId);
            case "or":
                return new OrGate(componentId);
            case "xor":
                return new XorGate(componentId);
            default:
                return null;
        }
    }
}

// Abstract class that must be implemented by more concrete subclasses
class LogicGate extends GameComponent {
    // Set of LogicGate objects representing input connections
    #inputSet = new Set();
    // Set of LogicGate objects representing output connections
    #outputSet = new Set();
    // Integer determining the maximum amount of inputs a logic gate can have
    #inputLimit;
    // Boolean representing the outcome of the last calculateOutput() result
    #stateSnapshot;

    constructor(componentId, inputLimit) {
        super(componentId);
        if (this.constructor == LogicGate) {
            throw new Error("LogicGate is an abstract class and must be extended.");
        } else {
            this.#inputLimit = inputLimit;
        }
    }

    // Adds an object reference to the input set
    addInput(input) {
        if (this.#inputSet.size < this.#inputLimit) {
            this.#inputSet.add(input);
        }
    }

    // Adds an object reference to the output set
    addOutput(output) {
        this.#outputSet.add(output);
    }

    getOutput() {
        return(this.#stateSnapshot);
    }

    // An abstract method that requires implementation by a subclass
    logic(inputValues) {
        throw new Error("Method 'logic()' must be implemented.");
    }

    // Recursively calculates the logical output of a gate and its children
    calculateOutput(logic) {
        var results = [];

        // Getting outputs of the logic gate's inputs
        for (const input of Array.from(this.#inputSet.values)) {
            if (input instanceof LogicGate) {
                results.push(input.calculateOutput(input.logic));
            } else if (input instanceof UserInput || input instanceof StaticInput) {
                results.push(input.getOutput());
            } else {
                throw new Error("Input is unsupported type: " + typeof input);
            }
        }

        // Filling unused input space with false values to prevent errors
        if (this.#inputLimit > 0) {
            while (results.length < this.#inputLimit) {
                results.push(false);
            }
        } else if (results.length == 0) { // Ensure at least one value is filled
            results.push(false);
        }

        var output = logic(results);
        this.#stateSnapshot = output;

        return output;
    }
}

// NOT Gate that inverts the single input it receives
class NotGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 1);
    }

    logic(inputs) {
        return inputs[0] != true;
    }
}

// AND Gate that returns false if any value is false
class AndGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 0);
    }

    logic(inputs) {
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i] == false) {
              return false;
            }
          }

        return true;
    }
}

// OR Gate that returns true if any value is true
class OrGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 0);
    }

    logic(inputs) {
        let isTrue = false;
        for(let i=0; i<inputs.length; i++) {
            if(inputs[i] == true) {
                isTrue = true;
                break;
            }
        }
        return isTrue;
    }
}

// XOR Gate that returns true if only one value is true
class XorGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 2);
    }
    
    logic(inputs) {
        const input1 = inputs[0];
        const input2 = inputs[1];
        return (input1 && !input2) || (!input1 && input2);
    }
}

// Level class
class Level {
    // String storing the default state of the level for resets
    #levelString;
    #components = new Map();
    #description;

    constructor(levelString) {
        this.#levelString = levelString;
        this.reset();
    }

    // Takes a string and returns an array of strings representing each stage of the level creation pipeline
    #parseLevelString(levelString) {
        var levelStringArray = levelString.split("]");

        // Removing whitespace from non-description strings
        levelStringArray[0] = levelStringArray[0].replace(/\s+/g, '');
        levelStringArray[1] = levelStringArray[1].replace(/\s+/g, '');

        // Removing Excess brackets
        for (let i = 0; i < levelStringArray.length; i++) {
            levelStringArray[i] = levelStringArray[i].replaceAll("[", "");
        }

        return(levelStringArray);
    }
    
    // Creates components based on the string input and adds them to the #components map
    #createComponents(componentString) {
        this.#components.clear();
        const componentStringArray = componentString.split(",");

        componentStringArray.forEach(element => {
            const keyValuePair = element.split("=");
            var newComponent;

            // Temporary in-function factory until I replace LogicGateFactory with a ComponentFactory
            if (keyValuePair[1].toLowerCase() == "true") {
                newComponent = new StaticInput(keyValuePair[0], true);
            } else if (keyValuePair[1].toLowerCase() == "false") {
                newComponent = new StaticInput(keyValuePair[0], false);
            } else if (keyValuePair[1].toLowerCase() == "userinput") {
                newComponent = new UserInput(keyValuePair[0]);
            } else {
                newComponent = LogicGateFactory.constructLogicGate(keyValuePair[0], keyValuePair[1]);
            }

            // Making sure the value met one of the object creation requirements
            if (newComponent != null) {
                this.#components.set(keyValuePair[0], newComponent);
            } else {
                throw new Error("Value of pair: " + element + " is not supported");
            }
        });
    }

    // Connects existing components using the addInput function
    #createConnections(connectionString) {
        var filteredString = connectionString.replace(/\s+/g, '');

        const connectionStringArray = filteredString.split(")");

        connectionStringArray.forEach(element => {
            // Ignoring empty array items
            if(element != "") {
                // Remove leading commas created by split
                if (element.indexOf(",") == 0) {
                    element = element.substring(1);
                }

                const connectionHostId = element.substring(0, element.indexOf("("));
                const connectionHost = this.#components.get(connectionHostId);

                if (connectionHost == null) {
                    throw new Error("Connection host '" + connectionHostId + "' does not exist");
                }

                const inputArray =  element.substring(element.indexOf("(") + 1).split(",");

                inputArray.forEach(connectionChildId => {
                    const connectionChild = this.#components.get(connectionChildId);

                    if (connectionChild == null) {
                        throw new Error("Connection child '" + connectionChildId + "' does not exist");
                    }

                    connectionHost.addInput(connectionChild);
                });
            }
        });
    }

    // Returns the description of the level
    getDescription() {
        return(this.#description);
    }

    // Returns a deep copy of the levels components
    getComponents() {
        var mapClone = new Map(this.#components);
        return(mapClone);
    }

    // Resets the level to its default state
    reset() {
        var stringArray = this.#parseLevelString(this.#levelString);
        this.#createComponents(stringArray[0]);
        this.#createConnections(stringArray[1]);
        this.#description = stringArray[2];
    }
}

// Game class responsible for storing levels and interacting with the canvas
class Game {
    // Canvas object that the game will be displayed on
    #canvas;
    // Array of Level objects belonging to current game
    #levels = [];
    // Integer value representing the current level
    #currentLevel;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#currentLevel = 0;
        var cursor = 0;
        var bracketsFound = 0;
        
        // Levels are hardcoded for testing
        var gameString = `
        [userInput1=USERINPUT, notGate=NOT]
        [notGate(userInput1)]
        [This is a not gate, which inverts the input]
        
        [userInput1=USERINPUT, userInput2=USERINPUT, andGate=AND]
        [andGate(userInput1,userInput2)]
        [This is an and gate, which will only return true if both inputs are true]
        
        [userInput1=USERINPUT, userInput2=USERINPUT, orGate=OR]
        [orGate(userInput1,userInput2)]
        [Description]
        
        [userInput1=USERINPUT, userInput2=USERINPUT, xorGate=XOR]
        [xorGate(userInput1,userInput2)]
        [Description]
        `;
        
        while (true) {
            if (bracketsFound == 3) { // Currently parsed strings are a valid level
                bracketsFound = 0;

                var newLevel = new Level(gameString.substring(0,cursor).trim());
                this.#levels.push(newLevel);
                console.log(newLevel);

                gameString = gameString.substring(cursor);
                cursor = 0;
            } else { // Still looking for a valid level
                cursor = gameString.indexOf("]", cursor)+1;
                // If no more closing brackets, stops search. Otherwise continues
                if (cursor == 0) {
                    break;
                } else {
                    bracketsFound = bracketsFound + 1;
                }
            }
        }
    }

    getCurrentLevel() {
        return(this.#currentLevel);
    }

    // Advances to the next level
    nextLevel() {
        const oldLevel = this.#currentLevel;
        this.#currentLevel = Math.min(this.#levels.length, this.#currentLevel + 1);
        if (oldLevel != this.#currentLevel) {
            this.displayLevel();
        }
    }

    // Returns to the previous level
    previousLevel() {
        const oldLevel = this.#currentLevel;
        this.#currentLevel = Math.max(0, this.#currentLevel - 1);
        if (oldLevel != this.#currentLevel) {
            this.displayLevel();
        }
    }

    resetLevel() {
        this.#levels[this.#currentLevel].reset();
        this.displayLevel();
    }

    logicGate(){

    }
    
    // Draws UI elements to represent the state of the logic components of the level, and displays the level description 

    displayLevel() {
        // Get the canvas element and set the context to 2D
        var canvas = document.getElementById("game");
        var context = canvas.getContext("2d");

        // Create an array to store all components of the game
        this.components = [];

        // Load images for the gates
        var img = new Image();
        var img2 = new Image();
        var img3 = new Image();
        var img4 = new Image();
        img.src = "./images/XORGate.png";
        img2.src = "./images/ANDGate.png";
        img3.src = "./images/ORGate.png";
        img4.src = "./images/NOTGate.png";

        // Draw the gates and lines once images are loaded
        img4.onload = function() {
        // Draw images of gates on the canvas
            context.drawImage(img, 100, 10, 70, 70);
            context.drawImage(img3, 100, 200, 70, 70);
            context.drawImage(img2, 450, 10, 70, 70);
            context.drawImage(img4, 110, 110, 70, 70);
            context.drawImage(img2, 340, 105, 70, 70);
            context.drawImage(img, 650, 80, 70, 70);

            // Add text to the canvas
            context.fillStyle = 'green';
            context.font = '20px serif';
            context.fillText('✓', 70, 140);
        };

        // Draw a line from (x1, y1) to (x2, y2)
        function drawLine(context, x1, y1, x2, y2) {
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.strokeStyle = 'black';
            context.stroke();
        }   

        // Draw a circle with given fill color at (x1, y1) with given radius
        function drawCircle(context, fillStyle, x1, y1, x2, y2){
            context.fillStyle = fillStyle;
            context.beginPath();
            context.arc(x1, y1, x2, y2, 2 * Math.PI);
            context.fill();
        }

        // Draw initial red circles on the canvas
        drawCircle(context,'red', 20, 20, 10, 0);
        drawCircle(context,'red', 20, 70, 10, 0);
        drawCircle(context,'red', 20, 150, 10, 0);
        drawCircle(context,'red', 20, 210, 10, 0);
        drawCircle(context,'red', 20, 260, 10, 0);

        // Define circle coordinates and colors
        const circleStates = [false, false, false, false, false];
        const circlePositions = [
        { x: 20, y: 20 },
        { x: 20, y: 70 },
        { x: 20, y: 150 },
        { x: 20, y: 210 },
        { x: 20, y: 260 }
        ];

        // Toggle the state of a circle at the given index
        function updateCircleState(index) {
            circleStates[index] = !circleStates[index];
        }   

        // Redraw circles on the canvas based on current circleStates
        function drawCircles() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < circleStates.length; i++) {
                const isPressed = circleStates[i];
                const fillStyle = isPressed ? "green" : "red";
                drawCircle(context, fillStyle, circlePositions[i].x, circlePositions[i].y, 10, 0);
                drawCircle(context,'red', 820, 118, 20, 0);
                }
          }
        // Create instances of all the gates
        var andGate1 = new AndGate("andGate1");
        var orGate = new OrGate("orGate");
        var notGate = new NotGate("notGate");
        var xorGate1 = new XorGate("xorGate1");
        var andGate2 = new AndGate("andGate2");
        var xorGate2 = new XorGate("xorGate2");

        // Update the outputs of all the gates based on the current state of the circles
        function updateGates() {
            context.fillStyle = 'green';
            context.font = '20px serif';
            var orOutput = orGate.logic([circleStates[3], circleStates[4]]);
            var notOutput = notGate.logic([circleStates[2]]);
            var xorOutput1 = xorGate1.logic([circleStates[0], circleStates[1]]);
            var andOutput2 = andGate2.logic([orOutput, notOutput]);
            var andOutput1 = andGate1.logic([xorOutput1, andOutput2]);
            var xorOutput2 = xorGate2.logic([andOutput2, andOutput1]);
            
            
           if(orOutput == true) { // If the output is true, draw a checkmark
                context.fillText('✓', 70, 240);
            }
            else { // Otherwise, clear the checkmark
                context.clearRect(70, 220, 20, 20);
            }

            if(notOutput == true){ // If the output is true, draw a checkmark
                context.fillText('✓', 70, 140);
            }
            else{ // Otherwise, clear the checkmark
                context.clearRect(70, 120, 20, 20);
            }

            if(xorOutput1 == true){ // If the output is true, draw a checkmark
                context.fillText('✓', 70, 50);
            }
            else { // Otherwise, clear the checkmark
                context.clearRect(70, 30, 20, 20);
              }

            if(andOutput2 == true){ // If the output is true, draw a checkmark
                context.fillText('✓', 310, 145);
            }
            else{
                context.clearRect(310, 130, 20, 20);
            }

            if(andOutput1 == true){ // If the output is true, draw a checkmark
                context.fillText('✓', 425, 50);
            }
            else{ // Otherwise, clear the checkmark
                context.clearRect(425, 30, 20, 20);
            }

            if(xorOutput2 == true){ // If the output is true, draw a checkmark and a green circle at the specified coordinates
                drawCircle(context,'green', 820, 118, 20, 0);
                context.fillText('✓', 620, 120);
            }
            else{ // Otherwise, clear the checkmark and draw a red circle at the specified coordinates
                drawCircle(context,'red', 820, 118, 20, 0);
                context.clearRect(620, 100, 20, 20);
            }
        }   
        updateGates(); // update the gate inputs and outputs

         // function to handle click event on circles
        function handleCircleClick(event) {
            // get the x and y coordinates of the click event
            const x = event.offsetX;
            const y = event.offsetY;
            // loop through all the circles on the canvas
            for (let i = 0; i < circleStates.length; i++) {
                // get the x and y coordinates of the current circle
                const circleX = circlePositions[i].x;
                const circleY = circlePositions[i].y;
                // calculate the distance between the click and the current circle
                const distance = Math.sqrt((x - circleX) ** 2 + (y - circleY) ** 2);
                // if the distance is within 10 pixels of the circle, update the circle state and redraw it
                if (distance <= 10) {
                    updateCircleState(i);
                    drawCircle(context, circleStates[i] ? "green" : "red", circleX, circleY, 10, 0);
                    updateGates();
                    break;
                }
        }
    }

        canvas.addEventListener("click", handleCircleClick);
        drawCircles();
    
        drawLine(context, 50, 0, 50, 300);
        drawLine(context, 100, 70, 50, 70);
        drawLine(context, 100, 20, 50, 20);
        drawLine(context, 100, 45, 350, 45);
        drawLine(context, 350, 20, 350, 46);
        drawLine(context, 350, 20, 450, 20);
        drawLine(context, 100, 210, 50, 210);
        drawLine(context, 150, 235, 300, 235)
        drawLine(context, 100, 260, 50, 260);
        drawLine(context, 50, 145, 110, 145);
        drawLine(context, 420, 70, 450, 70);
        drawLine(context, 420, 140, 420, 70)
        drawLine(context, 300, 235, 300, 165);
        drawLine(context, 200, 115, 350, 115);
        drawLine(context, 300, 165, 350, 165);
        drawLine(context, 150, 145, 200, 145);
        drawLine(context, 200, 145, 200, 115);
        drawLine(context, 450, 45, 600, 45);
        drawLine(context, 600, 45, 600, 90);
        drawLine(context, 600, 90, 650, 90);
        drawLine(context, 400, 140, 650, 140);
        drawLine(context, 700, 116, 800, 116);

}
}

var canvas;

window.onload = function() {
    const canvas = document.getElementById("game");
    document.getElementById("levelNumber").innerHTML = "Level: 1";
    document.getElementById("levelDescription").innerHTML = "The aim of this level is to teach you the basics of how logic gates work and how to use them to turn on a light bulb.";
    newGame = new Game(document.getElementById("game"));
    newGame.displayLevel();
}
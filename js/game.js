/*
    Classes are currently grouped into the same .js file for ease of testing but will later be seperated
*/

class GameComponent {
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
}

// Class that handles game elements affected by user input
class UserInput extends GameComponent {
    // TODO: link to an interactable element on creation
    // TODO: Extend StaticInput instead of GameComponent
    constructor(componentId) {
        super(componentId);
    }

    getOutput() {
        return true;
    }
}

// Class that holds an unchanging boolean value
class StaticInput extends GameComponent {
    input;

    constructor(componentId, inputValue) {
        super(componentId);
        this.input = inputValue;
    }

    getOutput() {
        return this.input;
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
            default:
                return null;
        }
    }
}

// Abstract class that must be implemented by more concrete subclasses
class LogicGate extends GameComponent {
    inputSet = new Set();
    outputSet = new Set();
    inputLimit;

    constructor(componentId, inputLimit) {
        if (this.constructor == LogicGate) {
            throw new Error("LogicGate is an abstract class and must be extended.");
        } else {
            super(componentId);
            this.inputLimit = inputLimit;
        }
    }

    // Adds an object reference to the input set
    addInput(input) {
        this.inputSet.add(input);
    }

    // Adds an object reference to the output set
    addOutput(output) {
        this.outputSet.add(output);
    }

    // An abstract method that requires implementation by a subclass
    logic(inputValues) {
        throw new Error("Method 'logic()' must be implemented.");
    }

    // Recursively calculates the logical output of a gate and its children
    calculateOutput(logic) {
        results = [];

        // Getting outputs of the logic gate's inputs
        for (const input of inputSet.values) {
            if (input instanceof LogicGate) {
                results.push(input.calculateOutput(input.logic));
            } else if (input instanceof UserInput || input instanceof StaticInput) {
                results.push(input.getOutput());
            } else {
                throw new Error("Input is unsupported type: " + typeof input);
            }
        }

        // Filling unused input space with false values to prevent errors
        if (this.inputLimit > 0) {
            while (results.length < this.inputLimit) {
                results.push(false);
            }
        } else if (results.length == 0) { // Ensure at least one value is filled
            results.push(false);
        }

        return logic(results);
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
        inputs.forEach(element => {
            if (element == false) {
                return false;
            }
        });

        return true;
    }
}

// OR Gate that returns true if any value is true
class OrGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 0);
    }

    logic(inputs) {
        inputs.forEach(element => {
            if (element == true) {
                return true;
            }
        });

        return false;
    }
}

// XOR Gate that returns true if only one value is true
class XorGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 2);
    }

    logic(inputs) {
        var isTrue = false;

        inputs.forEach(element => {
            if (element == true) {
                if (isTrue == true) {
                    return (false);
                }

                isTrue = true;
            }
        });

        return(isTrue);
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
        stringArray = this.#parseLevelString(levelString);
        this.#createComponents(stringArray[0]);
        this.#createConnections(stringArray[1]);
        this.#description(stringArray[2]);
    }

    #parseLevelString(levelString) {
        var array = levelString.split(' ')
        if (array.length != 3) {
            console.log("Error")
        }
        return array

        
    }
    
    #createComponents(componentString) {
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

    #createConnections(connectionString) {

    }

    getDescription() {
        return(this.#description);
    }

    getComponents() {
        var mapClone = new Map(this.#components);
        return(mapClone);
    }

    reset() {

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

    constructor(canvas, filepath) {
        this.#canvas = canvas;
        this.#currentLevel = 0;
        //TODO: Read file from path
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

    // Draws UI elements to represent the state of the logic components of the level, and displays the level description 
    displayLevel() {
        
    }
}

var canvas;

window.onload = function() {
    const canvas = document.getElementById("game");
    // Testing html interactions
    document.getElementById("levelNumber").innerHTML = "Level: 1";
    document.getElementById("levelDescription").innerHTML = "Level description text";
}

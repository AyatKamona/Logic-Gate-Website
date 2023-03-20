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

    static constructLogicGate(gateIdentifier) {
        switch (gateIdentifier.toLowerCase()) {
            case "NOT":
                return new NotGate();
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

// Not Gate that inverts the single input it receives
class NotGate extends LogicGate {
    constructor(componentId) {
        super(componentId, 1);
    }

    logic(inputs) {
        return inputs[0] != true;
    }
}

// AND Gate that takes returns false if any value is false
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

// OR Gate that takes returns true if any value is true
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

// Game class
class Game {
    gameFile;
    levelStringArray = [];
    level;
    levelObjects = new Map();
    description;
    headGate;

    constructor(file) {
        this.gameFile = file;
        this.level = 0;
        // TODO: read file and enter levels into levelStringArray
        var levelString = "";
        this.createLevel();
    }

    // Advances to the next level
    nextLevel() {
        const oldLevel = this.level;
        this.level = Math.min(this.levelStringArray.length, this.level + 1);
        if (oldLevel != this.level) {
            this.createLevel();
        }
    }

    // Returns to the previous level
    previousLevel() {
        const oldLevel = this.level;
        this.level = Math.max(0, this.level - 1);
        if (oldLevel != this.level) {
            this.createLevel();
        }
    }
    
    // Takes the level string and sets up the objects, connections, and visuals required for the game to be played
    createLevel() {
        this.levelString = this.levelStringArray[level];
        this.createLevelObjects();
        this.stringToTree();
        this.displayLevel();
    }

    // Converts an object string to a map of objects
    createLevelObjects(objectString) {
        this.levelObjects.clear();
        const objectStringArray = objectString.split(",");
        objectStringArray.forEach(element => {
            const keyValuePair = element.split("=");
            var newObject;

            if (keyValuePair[1].toLowerCase() == "true") {
                newObject = new StaticInput(true);
            } else if (keyValuePair[1].toLowerCase() == "false") {
                newObject = new StaticInput(false);
            } else if (keyValuePair[1].toLowerCase() == "userinput") {
                newObject = new UserInput();
            } else {
                newObject = LogicGateFactory.constructLogicGate(keyValuePair[1]);
            }

            // Making sure the value met one of the object creation requirements
            if (newObject != null) {
                this.levelObjects.set(keyValuePair[0], newObject);
            } else {
                throw new Error("Value of pair: " + element + " is not supported");
            }
        });
    }

    // Converts a connection string to a game object tree
    stringToTree(connectionString) {
        const ConnectionStringArray = connectionString.split(",");
        // TODO: get ID's from string and insert inputs/outputs to the their respective objects
    }

    // Draws UI elements to represent the state of the logic components of the level, and displays the level description 
    displayLevel(canvas) {
        document.getElementById("levelNumber").innerHTML = "Level: " + (this.level+1);
        document.getElementById("levelDescription").innerHTML = this.description;
    }
}

var canvas;

window.onload = function() {
    const canvas = document.getElementById("game");
    //Tesing html interactions
    document.getElementById("levelNumber").innerHTML = "Level: 1";
    document.getElementById("levelDescription").innerHTML = "Level description text";
}
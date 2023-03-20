/*
    Classes are currently grouped into the same .js file for ease of testing but will later be seperated
*/

// Class that handles game elements affected by user input
class UserInput {
    inputId;

    // TODO: link to an interactable element on creation
    constructor(inputId) {
        this.inputId = inputId;
    }

    getOutput() {
        return true;
    }
}

// Class that holds an unchanging boolean value
class StaticInput {
    input;

    constructor(inputValue) {
        this.input = inputValue;
    }

    getOutput() {
        return this.input;
    }
}

// Static factory class for creating logic gates based on a string identifier
class LogicGateFactory {
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
class LogicGate {
    inputSet = new Set();
    outputSet = new Set();
    inputLimit;

    constructor(inputLimit) {
        if (this.constructor == LogicGate) {
            throw new Error("LogicGate is an abstract class and must be extended.");
        } else {
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
        while (results.length != this.inputLimit) {
            results.push(false);
        }

        return logic(results);
    }
}

// Not Gate that inverts the single input it receives
class NotGate extends LogicGate {
    constructor() {
        super(1);
    }

    logic(inputs) {
        return inputs[0] != true;
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
    displayLevel() {
        document.getElementById("levelNumber").innerHTML = "Level: " + (this.level+1);
        document.getElementById("levelDescription").innerHTML = this.description;
    }

    // Compares expected boolean value against real value. Used for determining if player has completed level
    validateOutput(logicGateId, expectedValue) {
        
    }
}

var canvas;

window.onload = function() {
    canvas = document.getElementById("game");
    //Tesing html interactions
    document.getElementById("levelNumber").innerHTML = "Level: 1";
    document.getElementById("levelDescription").innerHTML = "Level description text";
}
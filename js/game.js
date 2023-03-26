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
        for (const input of this.#inputSet.values) {
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

    // Draws UI elements to represent the state of the logic components of the level, and displays the level description 

    displayLevel() {
        var canvas = document.getElementById("game");
        var context = canvas.getContext("2d");
        var img = new Image();
        img.src = "../images/ANDGate.png";
        window.onload = function(){
            context.drawImage(img, 100, 200, 50, 50);
            context.beginPath();
            context.moveTo(50, 50);
            context.lineTo(100, 200);
            context.stroke();
            }; 
    }
}

var canvas;

window.onload = function() {
    const canvas = document.getElementById("game");
    document.getElementById("levelNumber").innerHTML = "Level: 1";
    document.getElementById("levelDescription").innerHTML = "Level description text";

    newGame = new Game(document.getElementById("game"));
}
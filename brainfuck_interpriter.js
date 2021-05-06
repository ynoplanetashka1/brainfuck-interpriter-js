const prompt_sync = require('prompt-sync')();

var commandsList = new Array;

function searchForCloseBrackets(str, openBrackets, closeBrackets, fromIndex) {
	var currentIndex = fromIndex;
	var bracketsBalancer = 1;

	while (currentIndex < str.length) {
		if (str[currentIndex] === openBrackets)
			bracketsBalancer++;
		if (str[currentIndex] === closeBrackets)
			bracketsBalancer--;

		if (bracketsBalancer === 0)
			return currentIndex;

		currentIndex++;
	}
}

class PromptSyncInputAdapter
{
	constructor() {}

	getCharacter() {
		return String.prototype.charCodeAt.call(prompt_sync(''), 0);
	}
}

const promptSyncInputAdapter = new PromptSyncInputAdapter();

class bytesArray
{
	static create() {
		return new Proxy(
			new Object,
			{
				get(innerObject, property_) {
					if (property_ in innerObject)
						return innerObject[property_]
					else {
						innerObject[property_] = 0;
						return 0;
					}
				},
				set(..._args) {
					Reflect.set(..._args);
				}
			}
		)
	}

}

class bfStream
{
	constructor(bfCode, inputStream = promptSyncInputAdapter) {
		this[bfStream.innerCodeSymbol] = bfCode;
		this[bfStream.innerCodeIndexSymbol] = 0;
		this.bytesArray = bytesArray.create();
		this.currentIndex = 0;
		this.openBracketsIndexesArray = new Array;
		this.inputStream = inputStream;
	}

	invokeCommand() {
		if (this[bfStream.innerCodeSymbol][this[bfStream.innerCodeIndexSymbol]] in commandsList)
			commandsList[this[bfStream.innerCodeSymbol][this[bfStream.innerCodeIndexSymbol]]].call(this);
		this[bfStream.innerCodeIndexSymbol]++;
	}

	runProgram() {
		while (this[bfStream.innerCodeIndexSymbol] < this[bfStream.innerCodeSymbol].length) {
			this.invokeCommand();
		}
	}

}

Object.defineProperty(bfStream, 'innerCodeSymbol', { value: Symbol('inner code'), writable: false });
Object.defineProperty(bfStream, 'innerCodeIndexSymbol', { value: Symbol('inner code interpretation index'), writable: false });
Object.defineProperty(bfStream, 'invokeCommand+',
	{ value: function()
		{
			this.bytesArray[this.currentIndex]++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand-',
	{ value: function()
		{
			this.bytesArray[this.currentIndex]--;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand>',
	{ value: function()
		{
			this.currentIndex++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand<',
	{ value: function()
		{
			this.currentIndex--;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand[',
	{ value: function()
		{
			if (this.bytesArray[this.currentIndex] === 0) {
				this.currentIndex = searchForCloseBrackets(this[bfStream.innerCodeSymbol], '[', ']', this[bfStream.innerCodeIndexSymbol] + 1) + 1;
				return;
			}
			this.openBracketsIndexesArray.push(this.currentIndex);
			this.currentIndex++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand]',
	{ value: function()
		{
			if (this.bytesArray[this.currentIndex] === 0) {
				this.openBracketsIndexesArray.pop();
				this.currentIndex++;
				return;
			}

			this.currentIndex = this.openBracketsIndexesArray[this.openBracketsIndexesArray.length - 1] - 1;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand.',
	{ value: function()
		{
			console.log(String.fromCharCode(this.bytesArray[this.currentIndex]));
		}
			, writable: false });

Object.defineProperty(bfStream, 'invokeCommand,',
	{ value: function()
		{
			this.bytesArray[this.currentIndex] = this.inputStream.getCharacter();
		}
			, writable: false });



commandsList['+'] = bfStream['invokeCommand+'];
commandsList['-'] = bfStream['invokeCommand-'];
commandsList['>'] = bfStream['invokeCommand>'];
commandsList['<'] = bfStream['invokeCommand<'];
commandsList['['] = bfStream['invokeCommand['];
commandsList[']'] = bfStream['invokeCommand]'];
commandsList['.'] = bfStream['invokeCommand.'];
commandsList[','] = bfStream['invokeCommand,'];

//tests

const bf = new bfStream(',>,<.>.');
bf.runProgram();
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

	throw new Error('terminated brackets not found.');
}

class PromptSyncInputAdapter
{
	constructor() {}

	getCharacter() {
		return String.prototype.charCodeAt.call(prompt_sync(''), 0);
	}
}

class ConsoleExportAdapter
{
	constructor() {}

	print(val) {
		console.log(val);
	}
}

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
				set(innerObject, property_, value_) {
					Reflect.set(innerObject, property_, ( (value_ % 256) + 256 ) % 256 );
				}
			}
		)
	}

}

class bfStream
{
	constructor(bfCode, paramsObj) {
		var defaultParams = {
			inputStream: new PromptSyncInputAdapter(),
			exportStream: new ConsoleExportAdapter()
		}
		paramsObj = new Object(paramsObj);
		paramsObj = Object.assign(defaultParams, paramsObj);

		this[bfStream.innerCodeSymbol] = bfCode;
		this[bfStream.innerCodeIndexSymbol] = 0;
		this.bytesArray = bytesArray.create();
		this.currentIndex = 0;
		this.openBracketsIndexesArray = new Array;
		this.inputStream = paramsObj.inputStream;
		this.exportStream = paramsObj.exportStream;
	}

	invokeCommand() {
		if (this[bfStream.innerCodeSymbol][this[bfStream.innerCodeIndexSymbol]] in commandsList)
			commandsList[this[bfStream.innerCodeSymbol][this[bfStream.innerCodeIndexSymbol]]].call(this);
		else
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
			this[bfStream.innerCodeIndexSymbol]++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand-',
	{ value: function()
		{
			this.bytesArray[this.currentIndex]--;
			this[bfStream.innerCodeIndexSymbol]++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand>',
	{ value: function()
		{
			this.currentIndex++;
			this[bfStream.innerCodeIndexSymbol]++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand<',
	{ value: function()
		{
			this.currentIndex--;
			this[bfStream.innerCodeIndexSymbol]++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand[',
	{ value: function()
		{
			if (this.bytesArray[this.currentIndex] === 0) {
				this[bfStream.innerCodeIndexSymbol] = searchForCloseBrackets(this[bfStream.innerCodeSymbol], '[', ']', this[bfStream.innerCodeIndexSymbol] + 1) + 1;
				return;
			}
			this.openBracketsIndexesArray.push(this[bfStream.innerCodeIndexSymbol]);
			this[bfStream.innerCodeIndexSymbol]++;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand]',
	{ value: function()
		{
			if (this.bytesArray[this.currentIndex] === 0) {
				this.openBracketsIndexesArray.pop();
				this[bfStream.innerCodeIndexSymbol]++;
				return;
			}

			this[bfStream.innerCodeIndexSymbol] = this.openBracketsIndexesArray[this.openBracketsIndexesArray.length - 1] + 1;
		}
			, writable: false });
Object.defineProperty(bfStream, 'invokeCommand.',
	{ value: function()
		{
			// this.exportStream.print(String.fromCharCode(this.bytesArray[this.currentIndex]));
			this.exportStream.print(this.bytesArray[this.currentIndex]);
			this[bfStream.innerCodeIndexSymbol]++;
		}
			, writable: false });

Object.defineProperty(bfStream, 'invokeCommand,',
	{ value: function()
		{
			this.bytesArray[this.currentIndex] = this.inputStream.getCharacter();
			this[bfStream.innerCodeIndexSymbol]++;
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

const bf = new bfStream(
`
set first cell to minus 1
-
>>>

achive 48 if current and next cells are zero

+++ +++
[
> +++ +++ ++
<-
]

>
[
-<+>
] <->

get user input and transform it to corresponding index

,
<
[
->-<
]
>-

<---> set stational point

next goes cells
[->>>[>>>]--  ---[+++[<<<]---]+++ >]

reset settled flags
>>>[++>>>]
---[+++[<<<]---]+++ >
`
	);
bf.runProgram();
// (new bfStream(`+[[.-].]`)).runProgram();
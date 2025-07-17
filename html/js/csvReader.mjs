
const quote = '"';
const comma = ',';
const newline = [
	'\n',
	'\r',
]
// 转义斜线
const escape = '\\';

const clearValue = value=>{
	if(value.startsWith(quote) && value.endsWith(quote)){
		value = value.slice(1, -1);
	}
	// \u8204
	value = value.replace(/[\u8204\u200B\uFEFF]/g, ''); // 清除零宽空格
	value = value.replace(/\p{Cf}/gu, ''); // 清除控制字符

	value = value.trim();

	return value;
}

const csvParse = (text,KeyMap={})=>{
	let index = 0;
	const lines = [];
	const length = text.length;
	let line = [];
	let value = '';
	let inQuote = false;
	let inValue = false;
	let inHeader = true;
	let inLine = true;

	while(index<length){
		const char = text[index];
		if(inQuote){ // 如果在引号内
			if(char === quote){ // 如果是引号，那么跳出引号
				inQuote = false;
				index++;
				continue;
			}

			value += char;
			index++;
			continue;
		}
		
		if(char === quote){ // 如果是引号，那么进入引号
			inQuote = true;
			index++;
			continue;
		}
		
		if(char === comma){ // 如果是逗号

			line.push(clearValue(value));
			value = '';

			index++;
			continue;

		}

		// 如果是换行
		if(newline.includes(char)){
			const nextChar = text[index+1];
			if(nextChar === '\n'){ // 如果是\r\n
				index++;
			}

			
			line.push(clearValue(value));
			value = '';

			
			lines.push(line);
			line = [];

			index++;
			continue;
		}
		
		value += char;
		index++;
	}

	line.push(clearValue(value));

	const header = lines.shift().map(key=>KeyMap[key] || key);

	const data = [];
	for(let line of lines){
		const obj = {};
		for(let i = 0; i<header.length; i++){
			const key = header[i];
			if(!key) continue; // 跳过空的header
			obj[key] = line[i];
		}
		data.push(obj);
	}

	console.log(data);

	return {
		data,
		header,
		lines
	};
}
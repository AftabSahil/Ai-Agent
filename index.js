import Openai from 'openai';
import readlinesync from 'readline-sync';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const client = new Openai({
  apiKey: NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

//tools
function getWeatherDetails(city){
    if (city.toLowerCase() === 'patiala') return '10°C';
    if (city.toLowerCase() === 'mohali') return '14°C';
    if (city.toLowerCase() === 'banglore') return '20°C';
    if (city.toLowerCase() === 'chandigarh') return '8°C';
    if (city.toLowerCase() === 'delhi') return '12°C';
    
}

const tools={
    "getWeatherDetails": getWeatherDetails
}
const system_prompt = `you are an ai assistant with START, PLAN, ACTION and Observation and Output State.
wait for the user prompt and first PLAN using available tools.
After planning, take the action with appropriant tools and wait for the obsertion based on action.
Once you get the observation retunn the AI response based on Start prompt and observatoion

strictly follow the json output format as in examples
Available tools:
- function getWeatherDetails(city: string):string
getWeatherDetails is a function that accepts city name as strings and return the weather details.
EXAMPLE
START
{ "type": "user", "user": "What is the sum of weather of Patiala and Mohali?" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{ "type": "action", "function": "getWeatherDetails", "input": "patiala" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will call getWeatherDetails for Mohali" }
{ "type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "14°C" }
{ "type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C" }
 `;

const messages =[{role:'system', content:system_prompt}];
    while(true){
    const query = readlinesync.question('>> ');
    const q={
        type: 'user',
        user:query,
    };
    messages.push({role:"user", content:JSON.stringify(q)});

    while(true){
        const chat= await client.chat.completions.create({
            model: 'nvidia/nemotron-3-ultra-550b-a55b',
            messages:messages,
            response_format:{type:"json_object"}
        });

        const result = chat.choices[0].message.content;
        messages.push({role:"assistant", content:result});

        console.log(`\n\n---------------START AI------------------`);
        console.log(result);
        console.log(`---------------END AI------------------\n\n`);
        
        const call= JSON.parse(result);

        if (call.type=='output'){
            console.log(`🤖: ${call.output}`)
            break;
        } else if(call.type=="action"){
            const fn =tools[call.function];
            const observation=fn(call.input);
            const obs={"type": "observation", "observation": observation};
            messages.push({role:"developer", content:JSON.stringify(obs)});
        }
        
    }
}
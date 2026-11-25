const express = require("express");
const path = require("path");
const app = express();
app.use(express.json({limit:"30kb"}));
app.use(express.static(path.join(__dirname,"public")));
const PORT = process.env.PORT || 3000;

const instructions = `You are VERMA AI, a capable, friendly general-purpose AI assistant.
Answer in the same language as the user: Hindi, Hinglish, or English.
You can help with science, physics, chemistry, biology, mathematics, history,
geography, technology, computers, coding, general knowledge, writing, and everyday learning.
Explain difficult topics in simple steps, use examples, and structure longer answers with headings.
For science questions, distinguish established facts from hypotheses and mention uncertainty when relevant.
For calculations, show steps and check the result. If a question is unclear, ask one short clarification.
Do not pretend to browse the internet or know live facts unless a connected tool provides them.
Do not invent sources, facts, or capabilities. Be honest when unsure.
For the VERMA AI project context, Sumit is the Founder and Kartik Verma is the Co-Founder.
Do not invent additional company facts.`;

app.get("/api/health",(_req,res)=>res.json({ok:true,name:"VERMA AI"}));

app.post("/api/chat",async(req,res)=>{
  const message=typeof req.body.message==="string"?req.body.message.trim():"";
  if(!message) return res.status(400).json({error:"अपना सवाल लिखिए।"});
  if(message.length>12000) return res.status(413).json({error:"सवाल बहुत लंबा है। कृपया इसे छोटा करें।"});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"AI अभी कनेक्ट नहीं है। Hosting में OPENAI_API_KEY सेट करना बाकी है।"});
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||"gpt-4.1-mini",
        instructions,
        input:message,
        max_output_tokens:1800
      })
    });
    const data=await response.json();
    if(!response.ok){
      console.error("OpenAI API error:",data.error?.message||response.status);
      return res.status(502).json({error:"AI सेवा से जवाब नहीं मिला। कृपया बाद में कोशिश करें।"});
    }
    const reply=(data.output||[]).flatMap(x=>x.content||[])
      .filter(x=>x.type==="output_text").map(x=>x.text).join("\n").trim();
    res.json({reply:reply||"मुझे इस बार जवाब नहीं मिला। दोबारा पूछें।"});
  }catch(e){
    console.error(e.message);
    res.status(500).json({error:"सर्वर में समस्या है।"});
  }
});
app.listen(PORT,()=>console.log("VERMA AI ready on port "+PORT));

'use strict';
(function(){
const $=id=>document.getElementById(id), esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PROGRAMS={
 soma:[['LOAD','R2',32],['LOAD','R3',33],['ADD','R1','R2','R3'],['STORE',34,'R1'],['OUT','R1'],['HALT']],
 cache:[['LOAD','R2',32],['LOAD','R3',32],['ADD','R1','R2','R3'],['STORE',34,'R1'],['LOAD','R0',34],['OUT','R0'],['HALT']],
 entrada:[['IN','R2'],['LOAD','R3',33],['ADD','R1','R2','R3'],['OUT','R1'],['HALT']]
};
let s,timer=null;
function format(i){if(!i)return '—';const [o,...a]=i;if(o==='LOAD')return `LOAD ${a[0]}, [${a[1]}]`;if(o==='STORE')return `STORE [${a[0]}], ${a[1]}`;if(o==='HALT')return 'HALT';return o+' '+a.join(', ')}
function validateField(id){let v=Number($(id).value);if(!Number.isInteger(v))v=0;v=Math.min(255,Math.max(0,v));$(id).value=v;return v}
function reset(){pause();let program=$("program").value;const mem=Array.from({length:64},()=>0);PROGRAMS[program].forEach((inst,i)=>mem[i]=inst.slice());mem[32]=validateField('data32');mem[33]=validateField('data33');mem[34]=0;
s={program,mem,reg:{R0:0,R1:0,R2:0,R3:0},pc:0,ir:null,mar:null,mdr:null,z:0,alu:'—',cu:'Pronto',phase:'FETCH',lastStage:null,halted:false,steps:0,retired:0,hits:0,misses:0,cache:Array.from({length:4},()=>({valid:false,tag:null,addr:null,value:null})),out:[],input:validateField('inputValue'),log:[],bus:{addr:'—',data:'—',ctrl:'IDLE'},active:[],traceHead:'Pronto para simular',traceText:'Clique em “Próxima etapa” para buscar a primeira instrução da memória.',changed:[]};render()}
function writeLog(stage,title,detail){s.log.unshift({stage,title,detail});s.log=s.log.slice(0,50);s.lastStage=stage;s.traceHead=title;s.traceText=detail}
function setBus(addr,data,ctrl){s.bus={addr:String(addr),data:String(data),ctrl};}
function readData(addr){const line=addr%4,tag=Math.floor(addr/4),slot=s.cache[line];let outcome, val;
if(slot.valid&&slot.tag===tag){s.hits++;outcome=`HIT (linha ${line})`;val=slot.value}else{s.misses++;outcome=`MISS (linha ${line}): acesso à RAM`;val=s.mem[addr];s.cache[line]={valid:true,tag,addr,value:val}}
return {value:val,outcome,line};}
function storeData(addr,value){let v=value&255; s.mem[addr]=v;let line=addr%4, tag=Math.floor(addr/4);s.cache[line]={valid:true,tag,addr,value:v};return `write-through + write-allocate na linha ${line}`;}
function step(){if(s.halted)return;
if(s.phase==='FETCH'){
const address=s.pc,inst=s.mem[address]; if(!Array.isArray(inst))throw Error(`Endereço ${address} não contém instrução.`);
s.mar=address;s.mdr=format(inst);s.ir=inst.slice();s.pc++;s.cu='BUSCAR';s.alu='—';setBus(address,format(inst),'READ');s.active=['nodeCU','nodeRegs','nodeBus','nodeRam'];s.changed=[];s.phase='DECODE';s.steps++;
writeLog('fetch',`FETCH · endereço ${address}`,`PC aponta para ${address}; MAR ← ${address}. A UC envia READ pelo barramento de controle; a RAM devolve “${format(inst)}” pelo barramento de dados para MDR e IR. PC ← ${s.pc}.`);
}else if(s.phase==='DECODE'){
const op=s.ir[0];s.cu='DECODIFICAR '+op;setBus('—','—','IDLE');s.active=['nodeCU','nodeRegs'];s.changed=[];s.phase='EXECUTE';s.steps++;
writeLog('decode',`DECODE · ${op}`,`A Unidade de Controle interpreta o opcode ${op} e identifica operandos da instrução “${format(s.ir)}”. Os dados de execução ainda não foram modificados.`);
}else if(s.phase==='EXECUTE'){
const [op,a,b,c]=s.ir;let detail='',changed=[],active=['nodeCU','nodeRegs'];s.cu='EXECUTAR '+op;
switch(op){
 case 'LOAD': {const r=readData(b);s.mar=b;s.mdr=r.value;s.reg[a]=r.value;s.z=+(r.value===0);setBus(b,r.value,'READ');detail=`MAR ← ${b}; leitura de dado em [${b}]: ${r.outcome}. MDR ← ${r.value}; ${a} ← ${r.value}; sinal READ. RAM é consultada somente no MISS.`;changed=[a];active.push('nodeCache','nodeBus','nodeRam');break;}
 case 'STORE':{const v=s.reg[b],result=storeData(a,v);s.mar=a;s.mdr=v;setBus(a,v,'WRITE');detail=`MAR ← ${a}; MDR ← ${v}; memória [${a}] ← ${v}. Escrita ${result}; cache e RAM atualizadas pelo barramento de dados, sinal WRITE.`;active.push('nodeCache','nodeBus','nodeRam');break;}
 case 'ADD':{const raw=s.reg[b]+s.reg[c],result=raw&255;s.reg[a]=result;s.z=+(result===0);s.alu=`${s.reg[b]} + ${s.reg[c]} = ${result}`;setBus('—','—','IDLE');detail=`ULA recebe ${b}=${s.reg[b]} e ${c}=${s.reg[c]}; calcula ${raw} (8 bits → ${result}); grava ${a} ← ${result} e atualiza flag Z=${s.z}.`;changed=[a];active.push('nodeALU');break;}
 case 'SUB':{const raw=s.reg[b]-s.reg[c],result=raw&255;s.reg[a]=result;s.z=+(result===0);s.alu=`${s.reg[b]} - ${s.reg[c]} = ${result}`;setBus('—','—','IDLE');detail=`ULA subtrai ${c} de ${b}, aplica módulo 256 e grava ${a} ← ${result}; Z=${s.z}.`;changed=[a];active.push('nodeALU');break;}
 case 'IN':s.reg[a]=s.input;s.z=+(s.input===0);setBus('E/S',s.input,'IN');detail=`O dispositivo de entrada disponibiliza ${s.input}; a UC transfere o valor para ${a}. Flag Z=${s.z}.`;changed=[a];active.push('nodeIO','nodeBus');break;
 case 'OUT':s.out.push(s.reg[a]);setBus('E/S',s.reg[a],'OUT');detail=`A UC transfere ${a}=${s.reg[a]} para o buffer do dispositivo de saída. Monitor exibe ${s.reg[a]}.`;active.push('nodeIO','nodeBus');break;
 case 'HALT':s.halted=true;s.cu='HALT';setBus('—','—','HALT');detail='A Unidade de Controle reconhece HALT e interrompe a busca de novas instruções. Programa concluído.';break;
 default:throw Error('Instrução não implementada: '+op);
}
s.changed=changed;s.active=active;s.retired++;s.steps++;s.phase=s.halted?'HALT':'FETCH';writeLog('exec',`EXECUTE · ${op}`,detail);if(s.halted)pause();
} render();}
function render(){const put=(id,value)=>$(id).textContent=String(value);put('pc',String(s.pc).padStart(2,'0'));put('cycles',s.steps);put('retired',s.retired);put('hits',s.hits);put('miss',`Falhas: ${s.misses}`);put('stateText',s.halted?'Finalizado':s.steps?'Em execução':'Em espera');put('stage',s.halted?'HALT':s.steps?({'FETCH':'Buscar','DECODE':'Decodificar','EXECUTE':'Executar'})[s.phase]:'Pronto');put('stagehint',s.halted?'Fim do programa':'Próxima fase');put('cuVal',s.cu);put('aluVal',s.alu);put('insideRegs',`PC=${s.pc} · IR=${s.ir?s.ir[0]:'—'}`);put('addr',s.bus.addr);put('data',s.bus.data);put('control',s.bus.ctrl);put('ioVal',`IN: ${s.input} / OUT: ${s.out.length?s.out.at(-1):'—'}`);put('cacheVal',`${s.hits} hit(s) · ${s.misses} miss(es)`);put('ramVal',`[34] = ${s.mem[34]}`);put('traceHead',s.traceHead);put('traceText',s.traceText);put('ir',format(s.ir));put('mar',s.mar===null?'—':s.mar);put('mdr',s.mdr===null?'—':s.mdr);put('z',s.z);
for(let i=0;i<4;i++){put('r'+i,s.reg['R'+i]);$('regR'+i).classList.toggle('moved',s.changed.includes('R'+i))}
for(const n of ['nodeCU','nodeALU','nodeRegs','nodeBus','nodeIO','nodeCache','nodeRam'])$(n).classList.toggle('active',s.active.includes(n));
for(const [name,id] of [['fetch','stepFetch'],['decode','stepDecode'],['exec','stepExecute']]){$(id).classList.toggle('current',s.lastStage===name);$(id).classList.toggle('done',s.lastStage===name&&s.halted)}
$('statebadge').textContent=s.halted?'CONCLUÍDO':'SIMULAÇÃO ATIVA';$('statebadge').classList.toggle('halted',s.halted);$('step').disabled=s.halted;$('auto').disabled=s.halted;$('auto').textContent=timer?'Ⅱ Pausar automático':'▷ Executar automático';
put('progSize',`${PROGRAMS[s.program].length} instruções`);$('programList').innerHTML=PROGRAMS[s.program].map((i,index)=>`<tr class="${s.ir && index===s.pc-1?'active':''}"><td class="mono">${String(index).padStart(2,'0')}</td><td class="mono">${esc(format(i))}</td><td>${index<s.pc-1||s.halted&&index<s.pc?'✓':index===s.pc-1?'● atual':'—'}</td></tr>`).join('');
$('dataList').innerHTML=[32,33,34].map(a=>`<tr class="${s.mar===a?'active':''}"><td class="mono">[${a}]</td><td class="mono">${s.mem[a]}</td><td>${a===34?'Resultado':a===32?'Operando A':'Operando B'}</td></tr>`).join('');
$('cacheList').innerHTML=s.cache.map((x,i)=>`<tr><td>${i}</td><td class="mono">${x.valid?x.tag:'—'}</td><td>${x.valid?'['+x.addr+']':'vazia'}</td><td class="mono">${x.valid?x.value:'—'}</td></tr>`).join('');
$('screen').innerHTML=s.out.length?s.out.map((v,i)=>`<span>${i?'<span style="opacity:.4">·</span> ':''}${v}</span>`).join(''):'<em>Sem saída até o momento</em>';
$('log').innerHTML=s.log.length?s.log.map((x,i)=>`<div class="entry ${x.stage}"><b>${s.steps-i} · ${esc(x.title)}</b><p>${esc(x.detail)}</p></div>`).join(''):'<div class="entry"><b>Inicializado</b><p>Dados e instruções carregados. Avance para iniciar.</p></div>';
}
function pause(){if(timer){clearInterval(timer);timer=null}if(s)render()}
function toggleAuto(){if(timer){pause();return;}if(s.halted)return;timer=setInterval(()=>{if(!s.halted)step();else pause()},850);render()}
function exportText(){const lines=[`NEOCORE COMPUTER LAB - RASTRO DE EXECUÇÃO`,`Programa: ${s.program}`,`Estado: ${s.halted?'concluído':'parcial'}`,`Microetapas: ${s.steps}`,`Instruções: ${s.retired}`,`Cache: ${s.hits} hits, ${s.misses} misses`,`Registradores: ${JSON.stringify(s.reg)}`,`RAM[32]=${s.mem[32]}, RAM[33]=${s.mem[33]}, RAM[34]=${s.mem[34]}`,`Saída: ${s.out.join(', ')||'(vazia)'}`,'',...s.log.slice().reverse().map((l,i)=>`${i+1}. ${l.title}\n   ${l.detail}`)];const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`NeoCore_Execucao_${s.program}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('step').addEventListener('click',step);$('auto').addEventListener('click',toggleAuto);$('reset').addEventListener('click',reset);$('export').addEventListener('click',exportText);$('program').addEventListener('change',reset);reset();
window.NeoCoreTest={getState:()=>JSON.parse(JSON.stringify(s)),step,reset,run:()=>{for(let i=0;i<100&&!s.halted;i++)step();return JSON.parse(JSON.stringify(s));}};
})();

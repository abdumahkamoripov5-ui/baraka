const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../dist/app.js'),'utf8');
function app(raw){
 const nodes=new Map(),storage=new Map(raw?[['baraka-v1',JSON.stringify(raw)]]:[]);
 function node(selector){if(nodes.has(selector))return nodes.get(selector);const n={value:'',innerHTML:'',textContent:'',style:{},dataset:{},hidden:false,open:false,offsetWidth:1,events:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},querySelectorAll(){return[]},addEventListener(type,fn){this.events[type]=fn},append(){},remove(){},click(){},focus(){},getBoundingClientRect(){return{left:0,top:0,right:100,bottom:100,width:100,height:100}},showModal(){this.open=true},close(){this.open=false}};nodes.set(selector,n);return n}
 const context={console,Date,Intl,Math,Number,String,Boolean,Object,Array,JSON,Set,Map,Error,Blob,URL,globalThis:null,crypto:require('node:crypto').webcrypto,location:{hash:''},URLSearchParams,AbortSignal,navigator:{},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){},body:{dataset:{},classList:{toggle(){}},append(){}},createElement:()=>node('created')},addEventListener(){},window:{scrollTo(){},print(){}},setTimeout:()=>1,clearTimeout(){},FormData:class{constructor(form){return Object.entries(form.data)[Symbol.iterator]()}}};context.globalThis=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../../dist/model.js'),'utf8'),context);for(const file of ['places.js','favorites.js','day.js','life.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../../dist',file),'utf8'),context);vm.runInContext(source,context);return{run:s=>vm.runInContext(s,context),node,storage};
}

module.exports={app};

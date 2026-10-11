'use strict';
const {listCampaigns,getCampaign,preview}=require('../lib/campaign-library');
module.exports=async function campaigns(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.statusCode=405;res.end(JSON.stringify({error:'method_not_allowed'}));return;}
 const id=typeof req.query?.id==='string'?req.query.id:'';
 const step=typeof req.query?.step==='string'?req.query.step:'';
 if(!id){res.statusCode=200;res.end(JSON.stringify({campaigns:listCampaigns()}));return;}
 const campaign=getCampaign(id);
 if(!campaign){res.statusCode=404;res.end(JSON.stringify({error:'not_found'}));return;}
 if(step){try{res.statusCode=200;res.end(JSON.stringify(preview(id,step,{first_name:'Alex'})));}catch(_){res.statusCode=404;res.end(JSON.stringify({error:'step_not_found'}));}return;}
 res.statusCode=200;res.end(JSON.stringify({campaign}));
};

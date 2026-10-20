'use strict';
const path=require('node:path');
function loadUtilityAdapter(env=process.env){if(!env.BARAKA_UTILITY_ADAPTER)return null;const adapter=require(path.resolve(env.BARAKA_UTILITY_ADAPTER));if(!['lookup','createPayment','verifyWebhook'].every(k=>typeof adapter[k]==='function'))throw Error('Kommunal adapter lookup/createPayment/verifyWebhook metodlarini taqdim etishi kerak.');return adapter}
function validateCheckout(value,allowedHosts){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||!allowedHosts.includes(u.hostname))throw Error('To‘lov sahifasi ruxsat berilgan operator domenida emas.');return u.href}
module.exports={loadUtilityAdapter,validateCheckout};

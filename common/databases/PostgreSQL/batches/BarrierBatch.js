import CallbackBatch from "./CallbackBatch.js";

export default class BarrierBatch extends CallbackBatch
{
    execute(query, callback = null)
    {
        return new Promise(resolve => super.execute(query, callback ?? resolve));
    }
};
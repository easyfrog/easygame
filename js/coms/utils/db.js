/**
 * 数据库的封装
 */

var o = {
    server: 'http://inno.yesky.com:6345/db',
    getData: function(db, coll, params, cb) {
        ztc.jsonp(o.server, {
            db: db,
            coll: coll,
            method: 'find',
            query: params.query,
            options: params.options || {
                _id: 0
            }
        }, function(res) {
            if (cb) {cb(res.result);}
        });
    },
    getWxUser: function(openid, cb) {
        o.getData('xmas', 'wxusers', {
            query: {
                openid: openid
            }
        }, cb);
    }, 
};

module.exports = function() {
    return o;
};
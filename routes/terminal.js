
/*
 * GET terminal
 */

exports.index = function(req, res){
    res.render('terminal', {
        title : 'Web Terminal',
    });
};

var wkhtmltopdf = require('wkhtmltopdf');

wkhtmltopdf('<body>Namah Shivaya</body>', {output : 'abc.pdf'}, function(err){});
wkhtmltopdf('<body>hello world!</body>', {output : 'dvdv.pdf'}, function(err){});



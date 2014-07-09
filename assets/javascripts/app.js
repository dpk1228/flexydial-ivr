/*function uploadResToClient(){
  alert("NMS");
  var ip_port = "http://"+document.getElementById("ip_address").value;
  alert(ip_port);
  var socket = io.connect(ip_port);
  
  socket.on('connect', function(){
           alert("Namah Shivaya!!");
   /* var delivery = new Delivery(socket);
    delivery.on('delivery.connect',function(delivery){
           alert("NMS");
      $("input[type=submit]").click(function(evt){
        var file = $("input[type=file]")[0].files[0];
        delivery.send(file);
        evt.preventDefault();
      });
    });

    delivery.on('send.success',function(fileUID){
      alert("file was successfully sent.");
    });
  });*/
//return false
//}

//function uploadResToClient(){
/*var ip_port = 'http://'+document.getElementById("ip_address").value;
alert('NMS'+ip_port);
var socket_rec = io.connect(ip_port);

  socket_rec.on('connect', function(){
    alert("Connected!!!");
    socket_rec.close();
   // var delivery_rec = new Delivery(socket_rec);

    /*delivery_rec.on('receive.start',function(fileUID){
      alert('receiving a file!');
    });

    delivery_rec.on('receive.success',function(file){
      //if (file.isImage()) {
        $('img').attr('src', file.dataURL());
     // };
    });*/
//  });
//}


function uploadResToClient(){
var ip_port = 'http://'+document.getElementById("ip_address").value;
var did_number = document.getElementById("did_number").value;
//alert(ip_port+ did_number);
var socket_rec = io.connect(ip_port);
            socket_rec.emit('my other event', did_number);

  socket_rec.on('connect', function(){
   // alert("Connected!!!");
    var delivery = new Delivery(socket_rec);
    delivery.on('delivery.connect',function(delivery){
          // alert("NMS");
        //alert("NMS SENDING FILE");
        var file = $("input[type=file]")[0].files[0];
        file.data = file.data + "--"+"NamahSHivaya";
        delivery.send(file);
    });

   });
}

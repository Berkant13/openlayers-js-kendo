var tile_x = new ol.layer.Tile({
  source: new ol.source.OSM(),
});
var vector;

var wkt = new ol.format.WKT();
const source = new ol.source.Vector();
var extent_x = [];
var extent_y = [];
var extent = [];
vector = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: "rgba(255, 255, 255, 0.2)",
    }),
    stroke: new ol.style.Stroke({
      color: "#ffcc33",
      width: 2,
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: "#ffcc33",
      }),
    }),
  }),
});
var wkt_drawend;
create_table();
get_features();
var map = new ol.Map({
  
  target: 'map',
 
  layers: [tile_x,vector],
  
  view: new ol.View({
    center:[37.94729012167923 ,39.41599548234691],
    zoom: 6,
    projection: 'EPSG:4326',
  })
});
var draw; 
const typeSelect=document.getElementById('type');
if(typeSelect==null){
  typeSelect.value='Point';
}
draw_function();
var modal = document.getElementById("myModal");
var ekle_button=document.getElementById("BTN");
var modify = new ol.interaction.Modify({source: source});
map.addInteraction(modify);

var snap;

var span = document.getElementsByClassName("close")[0];
typeSelect.onchange = function () {
  
  map.removeInteraction(draw);
  draw_function();
  
};

function draw_function() {
  draw = new ol.interaction.Draw({
      source: source  ,
      type: typeSelect.value,
  }); 
map.addInteraction(draw);
snap= new ol.interaction.Snap({
  source:source,
});
map.addInteraction(snap);
 draw.on('drawend',function(evt){ 
      feature_=evt.feature;
      wkt_drawend=wkt.writeFeature(evt.feature);
      modal.style.display = "block";
      
      ekle_button.onclick=function(){
        modal.style.display = "none";
        var sehir=document.getElementById("fname").value;
        var ilce =document.getElementById("lname").value;
        feature_.sehir=sehir;
        feature_.ilce=ilce;
        post_ajax(feature_,wkt_drawend,sehir,ilce);
        add_new_row(sehir,ilce,wkt_drawend);
        document.getElementById("fname").value='';
        document.getElementById("lname").value='';
        console.log(source.getFeatures());
        create_table();
      }

  });
}
modify.on('modifyend',function(evt){
  wkt_modify=evt.features.getArray()[0];
  ajax_update(wkt_modify.id,wkt.writeFeature(wkt_modify),wkt_modify.sehir,wkt_modify.ilce);
  create_table();
  
})
span.onclick = function() {
  modal.style.display = "none";
}
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
   
  }
}


function create_table(){
  var crudServiceBaseUrl = "https://localhost:44382/api",
    dataSource = new kendo.data.DataSource({
      transport: {
        read: {
          url: crudServiceBaseUrl + "/location",
          type: "get",
          dataType: "json",
        },
        update:{
          url: crudServiceBaseUrl + "/location/update",
          type: "post",
          dataType: "json",
          contentType: "application/json; charset=utf-8"
        },
        destroy: {
          url: function(e) {
             console.log(e);
              return crudServiceBaseUrl + "/location?id=" + e.models[0].id;
          }, 
          type: "delete"
      },
        
        parameterMap: function (options, operation) {
          
          if (operation == "update" && options.models) {
            return JSON.stringify({
              id: options.models[0].id,
              sehir: options.models[0].sehir,
              ilce: options.models[0].ilce,
              wkt: options.models[0].wkt,
             
          });
          }
          if(operation=="destroy" ){
           for(let i=0;i<source.getFeatures().length;i++){
            if(source.getFeatures()[i].id==options.models[0].id){
              source.removeFeature(source.getFeatures()[i]);
            }
          }
          }
          
        }
      },

      batch: true,
      schema: {
        model: {
          id: "id",
          fields: {
            id: { editable: false, nullable: true },
            sehir: { editable: true, nullable: true },
            ilce: { editable: true, nullable: true },
            wkt: { editable: false, nullable: true },
          },
        },
      },
    });

    $("#grid").kendoGrid({
      dataSource: dataSource,
      height: 550,
      columns: [
        { field: "sehir", title: "??ehir", width: "100px" },
        { field: "ilce", title: "??l??e", format: "{0:c}", width: "120px" },
        { field: "wkt", title: "WKT", width: "120px" },
        { command: ["edit", "destroy"], title: "&nbsp;", width: "250px" },
      ],
      editable: "popup",
    });
  
}
function post_ajax(feature,wkt_drawend,sehir,ilce){
  
  $.ajax({
    url: 'https://localhost:44382/api/location',
    dataType: 'json',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify({'wkt':wkt_drawend,'sehir':sehir,'ilce':ilce}),
    success: function(data){
      feature.id=data;
    },
});
}
function add_new_row(sehir_,ilce_,wkt_){
  var grid = $("#grid").data("kendoGrid");
  grid.dataSource.add({sehir:sehir_,ilce:ilce_,wkt:wkt_})

}


function get_features(){
  
  $.ajax({
    url: 'https://localhost:44382/api/location',
    dataType: 'json',
    type: 'get',
    contentType: 'application/json',
    data:{"data":"check"},
    success: function(data){
      for (var i in data){
        var draw_wkt=data[i].wkt;
        var format = new ol.format.WKT();
        var feature = format.readFeature(draw_wkt, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326',
        });
       source.addFeature(feature);
       feature.id=data[i].id;
       feature.sehir=data[i].sehir;
       feature.ilce=data[i].ilce;
       
    } 
 
   
  }
});
}
function ajax_update(id,new_wkt_drawend,new_sehir,new_ilce){
  $.ajax({

    url: 'https://localhost:44382/api/location/update',
    dataType: 'json',
    type: 'post',
    contentType: 'application/json',
    data: JSON.stringify({'id':id,'wkt':new_wkt_drawend,'sehir':new_sehir,'ilce':new_ilce}),
    
});
  
}
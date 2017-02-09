// to draw a go board on the svg
// a really good exit example svg.selectAll('rect').data([board[7], board[4]], function(d){return d.id}).exit().remove();

var socket = new WebSocket("ws://localhost:8081");

var lis;

socket.onopen = openSocket;
socket.onmessage = showData;

console.log(socket)

function openSocket() {
  //  texter.append("h1").text('blahh');

  console.log('socket open')
    socket.send("Hello server");

  }

  function showData(result) {
  //  console.log('trying to show data, ', result.data.toString())
    // when the server returns, show the result in the div:

console.log(result);      // position the text


  }
var svg = d3.select('svg')

var width = svg.attr('width');
var height = svg.attr('height')

var boardwidth = 9;
var boardheight = 9;

var xoff = width/boardwidth;
var yoff = height/boardheight;

var backColor = [2,2,2];

var captured = [];

function pixel (xin, yin, color){


  this.xin = xin;
  this.yin = yin;
  this.color = color || [2,2,2];
  this.possession = 'none';
  this.id = 'p'+ xin +'-' + yin;
  this.liberties = [];

//  return this;

}

var player = [{player:1, color:[2,3,222], captured:0}, {player:2, color: [222, 2, 2], captured:0}];
var playerTurn = 0;

var board = [];


for(y = 0; y < boardwidth; y++){
  for(x=0; x < boardheight; x++){
  //  console.log(x)
    board.push(new pixel(x,y))

  }
}

console.log(board)


drawBoard(board)

function drawBoard(data){

  if(socket.readyState === 1){
    var ndboard = ""
    for(d of board){
      console.log('tostringpix', JSON.stringify(d))
      ndboard += JSON.stringify(d) + '\n';
    }
    socket.send(ndboard)
  }


  console.log('drawing board')
  var t = d3.transition()
      .duration(550);

svg.selectAll('rect').remove();

  var pixs = svg.selectAll('rect')
    .data(data
      //,
//      function(d){
//      console.log(d)
    //  return d.id;
  //  }
  )

  pixs.enter().append('rect')
    .attr('x', function(d){
    //  console.log(d)
      return xoff*d.xin;
    })
    .attr('height', function(d){
      return height/boardheight;
    })
    .attr('width', function(d){
      return width/boardwidth;
    })
    .attr('y', function(d){
      return yoff*d.yin;
    })
    .attr('id', function(d){
      return 'p'+d.xin + '-'+d.yin
    })
    .attr('d', function(d){
      return JSON.stringify(d);
    })
    .attr('stroke', 'blue')
    .attr('fill', function(d){
    //  console.log(d.color)

      return d3.rgb(d.color[0], d.color[1], d.color[2])
    })

    .attr('class', function(d){
      return d.possession;
    })
    .on('mouseover', function(d){
//      console.log(d)
      d3.select(this).attr('fill', 'black')

    })
    .on('mouseover', function(d){
    //  console.log(d)
    if(d.possession === "none"){
      d3.select(this).attr('fill', 'black')
    }

    })
    .on("mouseout", function(d){
    //  console.log('mout', d.color.toString())
      d3.select(this)
        .attr('fill', d3.rgb(d.color[0], d.color[1], d.color[2]))
        .attr('class', 'played');

    })
    .on("click", function(d){
    //  console.log('clicked on ', d);
    //  d.possession= "gogo";
    //  d.color = [2,2, 200];
  //    console.log(board)
      if( d.possession === "none"){
        d.possession= playerTurn;
        d.color = player[playerTurn].color;

        analyzemove(d);
        playerTurn = (playerTurn === 0) ? 1 : 0;
        console.log('changing turn to player:', playerTurn);

        var turndisp = d3.select('#turndisp');
        turndisp.text((playerTurn === 0) ? 1 : 2);
        d3.select('#capscore1').text(player[0].captured)

        d3.select('#capscore2').text(player[1].captured)

        drawBoard(board)

      }

      d3.select(this).attr('class', 'blink')

    })



}

function analyzemove(play){

  console.log('analyze move for: ', play)
  // check for capture
  checkforCap(play);
  // check if suicided
  //console.log('check for suicide')
  checkIfCaptured(play);
  // upate flaschentashen if connected


}


function checkforCap(play){
  var surroundings = getSurroundings(play);

  console.log('surroundings are: ', surroundings);
  var enemies = [];

  for(i of surroundings){
    if(i.possession !== 'none' && i.possession !== play.possession){
      console.log('enemy detected');
      enemies.push(i);
    }
  }

console.log('enemies to group: ', enemies);

for(o of enemies){
  checkIfCaptured(o);
}

}




function checkIfCaptured(start){

  var surround = getSurroundings(start);
  var friends = [];
  var done = [];

  for(i of surround){
  //  console.log(i)
    if(i.possession == 'none'){
      console.log('found freedom')
      return true;
    }
    else if(i.possession == start.possession){
      friends.push(i);
    }
  }

//  console.log('no freedoms found;')

  if(friends.length > 0){
    console.log('look through friends', friends)
    done.push(start);
    return findFree(friends, done)
  }
  else{
    console.log('think it got captured', start)
    captured.push(start);
    clearCaptured();

    return false;
  }

}

function findFree(goo, done){
  var friends = [];
  var done = done;

  for(o of goo){

    var surround = getSurroundings(o);

    for(i of surround){
      console.log(i)
      if(i.possession == 'none'){
        console.log('found freedomooo')
        return true;
      }
      else if(i.possession == o.possession){
        if(!done.includes(i)){
          friends.push(i);
        }
      }
    }
    done.push(o)

  }

  if(friends.length > 0){
    console.log('mo friends')
    return findFree(friends, done);
  }
  else{
    console.log('prob captured', done);
    for(p of done){
      captured.push(p)
    }

    clearCaptured();

    return false;
  }

}


// returns an array of the surrounding pixels for a pixel
function getSurroundings(play){
  var surroundings = []
  if(play.xin > 0 ){
    surroundings.push(coordsToPixel([play.xin-1, play.yin]))
  }
  if(play.yin > 0 ){
    surroundings.push(coordsToPixel([play.xin, play.yin-1]));
  }
  if(play.xin < boardwidth -1){
    surroundings.push(coordsToPixel([play.xin+1, play.yin]))
  }
  if(play.yin < boardheight -1){
    surroundings.push(coordsToPixel([play.xin, play.yin+1]))
  }

  return surroundings;
}




function coordsToPixel(i){

  var onrec = d3.select('#p' + i[0]+ '-' + i[1]  );

  var pixe = {};

  onrec.each(function(d){
  //  console.log(d)
    pixe = d;
  })//

  return pixe;

}



function clearCaptured(){
  for(cp of captured){
    console.log(cp)
    var capin = board.findIndex(function(d){
    //  console.log(d)
      return d.xin === cp.xin && d.yin === cp.yin;

    })

    var adpointsto = (cp.possession == 0) ? 1 : 0;

    player[adpointsto].captured = player[adpointsto].captured + 1;

    board[capin].possession = 'none';
    board[capin].color = backColor;

    console.log('captured, ', board[capin]);

  }

  captured = [];

}

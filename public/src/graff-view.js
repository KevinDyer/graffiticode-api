/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
var IS_MOBILE = (
  navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
);
var selfCleaningTimeout = {
  componentDidUpdate: function() {
    clearTimeout(this.timeoutID);
  },
  setTimeout: function() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout.apply(null, arguments);
  },
};
var GraffContent = React.createClass({
  componentDidMount: function() {
    GraffContent.dispatchToken = window.dispatcher.register(this.onChange);
    this.isDirty = false;
  },
  componentDidUpdate: function() {
    var el = React.findDOMNode(this);
    if (this.state && !this.state.error) {
      let pool = this.state.pool;
      let src = this.state.src;
      let obj = this.state.obj;
      viewer.update(el, obj, src, pool);
      let img = viewer.capture(el);
      postPiece(pool, src, obj, img);
    }
    function postPiece(pool, src, obj, img) {
      let exports = window.exports;
      let user = $("#username").data("user");
      obj = JSON.stringify(obj);
      let parent = exports.parent;
      let language = exports.language;
      $.ajax({
        type: "POST",
        url: "/code",
        data: {
          src: src,
          ast: pool,
          obj: "", //obj,
          img: img.replace(/\\/g, "\\\\"),
          user: user ? user.id : 1,
          parent: parent,
          language: language,
          label: "temp",
        },
        dataType: "json",
        success: function(data) {
          // FIXME add to state
          exports.id = data.id
          exports.gist_id = data.gist_id
        },
        error: function(xhr, msg, err) {
          console.log("Unable to submit code. Probably due to a SQL syntax error");
        }
      });
    }
  },
  onChange: function (data) {
    this.replaceState(data);
  },
  render: function () {
    return (
      <svg height="0" width="100%" style={{background: "white"}}>
        <g>
          <rect width="100%" height="100%" fill="white"/>
        </g>
      </svg>
    );
  },
});
var GraffView = React.createClass({
  mixins: [selfCleaningTimeout],
  MODES: {},
  propTypes: {
  },
  getDefaultProps: function() {
    return {
    };
  },
  getInitialState: function() {
    return {
    };
  },
  render: function() {
    return (
      <GraffContent className="graffContentStage" />
    );
  },
  componentDidMount: function() {
  },
  componentDidUpdate: function(prevProps, prevState) {
  },
});
export default GraffView;

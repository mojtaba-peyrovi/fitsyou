/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/preact/dist/preact.module.js"
/*!***************************************************!*\
  !*** ./node_modules/preact/dist/preact.module.js ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Component: () => (/* binding */ C),
/* harmony export */   Fragment: () => (/* binding */ S),
/* harmony export */   cloneElement: () => (/* binding */ W),
/* harmony export */   createContext: () => (/* binding */ X),
/* harmony export */   createElement: () => (/* binding */ k),
/* harmony export */   createRef: () => (/* binding */ M),
/* harmony export */   h: () => (/* binding */ k),
/* harmony export */   hydrate: () => (/* binding */ U),
/* harmony export */   isValidElement: () => (/* binding */ t),
/* harmony export */   options: () => (/* binding */ l),
/* harmony export */   render: () => (/* binding */ R),
/* harmony export */   toChildArray: () => (/* binding */ F)
/* harmony export */ });
var n,l,u,t,i,r,o,e,f,c,a,s,h,p,v,y,d={},w=[],_=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,g=Array.isArray;function m(n,l){for(var u in l)n[u]=l[u];return n}function b(n){n&&n.parentNode&&n.parentNode.removeChild(n)}function k(l,u,t){var i,r,o,e={};for(o in u)"key"==o?i=u[o]:"ref"==o?r=u[o]:e[o]=u[o];if(arguments.length>2&&(e.children=arguments.length>3?n.call(arguments,2):t),"function"==typeof l&&null!=l.defaultProps)for(o in l.defaultProps)void 0===e[o]&&(e[o]=l.defaultProps[o]);return x(l,e,i,r,null)}function x(n,t,i,r,o){var e={type:n,props:t,key:i,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:null==o?++u:o,__i:-1,__u:0};return null==o&&null!=l.vnode&&l.vnode(e),e}function M(){return{current:null}}function S(n){return n.children}function C(n,l){this.props=n,this.context=l}function $(n,l){if(null==l)return n.__?$(n.__,n.__i+1):null;for(var u;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e)return u.__e;return"function"==typeof n.type?$(n):null}function I(n){if(n.__P&&n.__d){var u=n.__v,t=u.__e,i=[],r=[],o=m({},u);o.__v=u.__v+1,l.vnode&&l.vnode(o),q(n.__P,o,u,n.__n,n.__P.namespaceURI,32&u.__u?[t]:null,i,null==t?$(u):t,!!(32&u.__u),r),o.__v=u.__v,o.__.__k[o.__i]=o,D(i,o,r),u.__e=u.__=null,o.__e!=t&&P(o)}}function P(n){if(null!=(n=n.__)&&null!=n.__c)return n.__e=n.__c.base=null,n.__k.some(function(l){if(null!=l&&null!=l.__e)return n.__e=n.__c.base=l.__e}),P(n)}function A(n){(!n.__d&&(n.__d=!0)&&i.push(n)&&!H.__r++||r!=l.debounceRendering)&&((r=l.debounceRendering)||o)(H)}function H(){try{for(var n,l=1;i.length;)i.length>l&&i.sort(e),n=i.shift(),l=i.length,I(n)}finally{i.length=H.__r=0}}function L(n,l,u,t,i,r,o,e,f,c,a){var s,h,p,v,y,_,g,m=t&&t.__k||w,b=l.length;for(f=T(u,l,m,f,b),s=0;s<b;s++)null!=(p=u.__k[s])&&(h=-1!=p.__i&&m[p.__i]||d,p.__i=s,_=q(n,p,h,i,r,o,e,f,c,a),v=p.__e,p.ref&&h.ref!=p.ref&&(h.ref&&J(h.ref,null,p),a.push(p.ref,p.__c||v,p)),null==y&&null!=v&&(y=v),(g=!!(4&p.__u))||h.__k===p.__k?(f=j(p,f,n,g),g&&h.__e&&(h.__e=null)):"function"==typeof p.type&&void 0!==_?f=_:v&&(f=v.nextSibling),p.__u&=-7);return u.__e=y,f}function T(n,l,u,t,i){var r,o,e,f,c,a=u.length,s=a,h=0;for(n.__k=new Array(i),r=0;r<i;r++)null!=(o=l[r])&&"boolean"!=typeof o&&"function"!=typeof o?("string"==typeof o||"number"==typeof o||"bigint"==typeof o||o.constructor==String?o=n.__k[r]=x(null,o,null,null,null):g(o)?o=n.__k[r]=x(S,{children:o},null,null,null):void 0===o.constructor&&o.__b>0?o=n.__k[r]=x(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):n.__k[r]=o,f=r+h,o.__=n,o.__b=n.__b+1,e=null,-1!=(c=o.__i=O(o,u,f,s))&&(s--,(e=u[c])&&(e.__u|=2)),null==e||null==e.__v?(-1==c&&(i>a?h--:i<a&&h++),"function"!=typeof o.type&&(o.__u|=4)):c!=f&&(c==f-1?h--:c==f+1?h++:(c>f?h--:h++,o.__u|=4))):n.__k[r]=null;if(s)for(r=0;r<a;r++)null!=(e=u[r])&&0==(2&e.__u)&&(e.__e==t&&(t=$(e)),K(e,e));return t}function j(n,l,u,t){var i,r;if("function"==typeof n.type){for(i=n.__k,r=0;i&&r<i.length;r++)i[r]&&(i[r].__=n,l=j(i[r],l,u,t));return l}n.__e!=l&&(t&&(l&&n.type&&!l.parentNode&&(l=$(n)),u.insertBefore(n.__e,l||null)),l=n.__e);do{l=l&&l.nextSibling}while(null!=l&&8==l.nodeType);return l}function F(n,l){return l=l||[],null==n||"boolean"==typeof n||(g(n)?n.some(function(n){F(n,l)}):l.push(n)),l}function O(n,l,u,t){var i,r,o,e=n.key,f=n.type,c=l[u],a=null!=c&&0==(2&c.__u);if(null===c&&null==e||a&&e==c.key&&f==c.type)return u;if(t>(a?1:0))for(i=u-1,r=u+1;i>=0||r<l.length;)if(null!=(c=l[o=i>=0?i--:r++])&&0==(2&c.__u)&&e==c.key&&f==c.type)return o;return-1}function z(n,l,u){"-"==l[0]?n.setProperty(l,null==u?"":u):n[l]=null==u?"":"number"!=typeof u||_.test(l)?u:u+"px"}function N(n,l,u,t,i){var r,o;n:if("style"==l)if("string"==typeof u)n.style.cssText=u;else{if("string"==typeof t&&(n.style.cssText=t=""),t)for(l in t)u&&l in u||z(n.style,l,"");if(u)for(l in u)t&&u[l]==t[l]||z(n.style,l,u[l])}else if("o"==l[0]&&"n"==l[1])r=l!=(l=l.replace(s,"$1")),o=l.toLowerCase(),l=o in n||"onFocusOut"==l||"onFocusIn"==l?o.slice(2):l.slice(2),n.l||(n.l={}),n.l[l+r]=u,u?t?u[a]=t[a]:(u[a]=h,n.addEventListener(l,r?v:p,r)):n.removeEventListener(l,r?v:p,r);else{if("http://www.w3.org/2000/svg"==i)l=l.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if("width"!=l&&"height"!=l&&"href"!=l&&"list"!=l&&"form"!=l&&"tabIndex"!=l&&"download"!=l&&"rowSpan"!=l&&"colSpan"!=l&&"role"!=l&&"popover"!=l&&l in n)try{n[l]=null==u?"":u;break n}catch(n){}"function"==typeof u||(null==u||!1===u&&"-"!=l[4]?n.removeAttribute(l):n.setAttribute(l,"popover"==l&&1==u?"":u))}}function V(n){return function(u){if(this.l){var t=this.l[u.type+n];if(null==u[c])u[c]=h++;else if(u[c]<t[a])return;return t(l.event?l.event(u):u)}}}function q(n,u,t,i,r,o,e,f,c,a){var s,h,p,v,y,d,_,k,x,M,$,I,P,A,H,T=u.type;if(void 0!==u.constructor)return null;128&t.__u&&(c=!!(32&t.__u),o=[f=u.__e=t.__e]),(s=l.__b)&&s(u);n:if("function"==typeof T)try{if(k=u.props,x=T.prototype&&T.prototype.render,M=(s=T.contextType)&&i[s.__c],$=s?M?M.props.value:s.__:i,t.__c?_=(h=u.__c=t.__c).__=h.__E:(x?u.__c=h=new T(k,$):(u.__c=h=new C(k,$),h.constructor=T,h.render=Q),M&&M.sub(h),h.state||(h.state={}),h.__n=i,p=h.__d=!0,h.__h=[],h._sb=[]),x&&null==h.__s&&(h.__s=h.state),x&&null!=T.getDerivedStateFromProps&&(h.__s==h.state&&(h.__s=m({},h.__s)),m(h.__s,T.getDerivedStateFromProps(k,h.__s))),v=h.props,y=h.state,h.__v=u,p)x&&null==T.getDerivedStateFromProps&&null!=h.componentWillMount&&h.componentWillMount(),x&&null!=h.componentDidMount&&h.__h.push(h.componentDidMount);else{if(x&&null==T.getDerivedStateFromProps&&k!==v&&null!=h.componentWillReceiveProps&&h.componentWillReceiveProps(k,$),u.__v==t.__v||!h.__e&&null!=h.shouldComponentUpdate&&!1===h.shouldComponentUpdate(k,h.__s,$)){u.__v!=t.__v&&(h.props=k,h.state=h.__s,h.__d=!1),u.__e=t.__e,u.__k=t.__k,u.__k.some(function(n){n&&(n.__=u)}),w.push.apply(h.__h,h._sb),h._sb=[],h.__h.length&&e.push(h);break n}null!=h.componentWillUpdate&&h.componentWillUpdate(k,h.__s,$),x&&null!=h.componentDidUpdate&&h.__h.push(function(){h.componentDidUpdate(v,y,d)})}if(h.context=$,h.props=k,h.__P=n,h.__e=!1,I=l.__r,P=0,x)h.state=h.__s,h.__d=!1,I&&I(u),s=h.render(h.props,h.state,h.context),w.push.apply(h.__h,h._sb),h._sb=[];else do{h.__d=!1,I&&I(u),s=h.render(h.props,h.state,h.context),h.state=h.__s}while(h.__d&&++P<25);h.state=h.__s,null!=h.getChildContext&&(i=m(m({},i),h.getChildContext())),x&&!p&&null!=h.getSnapshotBeforeUpdate&&(d=h.getSnapshotBeforeUpdate(v,y)),A=null!=s&&s.type===S&&null==s.key?E(s.props.children):s,f=L(n,g(A)?A:[A],u,t,i,r,o,e,f,c,a),h.base=u.__e,u.__u&=-161,h.__h.length&&e.push(h),_&&(h.__E=h.__=null)}catch(n){if(u.__v=null,c||null!=o)if(n.then){for(u.__u|=c?160:128;f&&8==f.nodeType&&f.nextSibling;)f=f.nextSibling;o[o.indexOf(f)]=null,u.__e=f}else{for(H=o.length;H--;)b(o[H]);B(u)}else u.__e=t.__e,u.__k=t.__k,n.then||B(u);l.__e(n,u,t)}else null==o&&u.__v==t.__v?(u.__k=t.__k,u.__e=t.__e):f=u.__e=G(t.__e,u,t,i,r,o,e,c,a);return(s=l.diffed)&&s(u),128&u.__u?void 0:f}function B(n){n&&(n.__c&&(n.__c.__e=!0),n.__k&&n.__k.some(B))}function D(n,u,t){for(var i=0;i<t.length;i++)J(t[i],t[++i],t[++i]);l.__c&&l.__c(u,n),n.some(function(u){try{n=u.__h,u.__h=[],n.some(function(n){n.call(u)})}catch(n){l.__e(n,u.__v)}})}function E(n){return"object"!=typeof n||null==n||n.__b>0?n:g(n)?n.map(E):void 0!==n.constructor?null:m({},n)}function G(u,t,i,r,o,e,f,c,a){var s,h,p,v,y,w,_,m=i.props||d,k=t.props,x=t.type;if("svg"==x?o="http://www.w3.org/2000/svg":"math"==x?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),null!=e)for(s=0;s<e.length;s++)if((y=e[s])&&"setAttribute"in y==!!x&&(x?y.localName==x:3==y.nodeType)){u=y,e[s]=null;break}if(null==u){if(null==x)return document.createTextNode(k);u=document.createElementNS(o,x,k.is&&k),c&&(l.__m&&l.__m(t,e),c=!1),e=null}if(null==x)m===k||c&&u.data==k||(u.data=k);else{if(e="textarea"==x&&null!=k.defaultValue?null:e&&n.call(u.childNodes),!c&&null!=e)for(m={},s=0;s<u.attributes.length;s++)m[(y=u.attributes[s]).name]=y.value;for(s in m)y=m[s],"dangerouslySetInnerHTML"==s?p=y:"children"==s||s in k||"value"==s&&"defaultValue"in k||"checked"==s&&"defaultChecked"in k||N(u,s,null,y,o);for(s in k)y=k[s],"children"==s?v=y:"dangerouslySetInnerHTML"==s?h=y:"value"==s?w=y:"checked"==s?_=y:c&&"function"!=typeof y||m[s]===y||N(u,s,y,m[s],o);if(h)c||p&&(h.__html==p.__html||h.__html==u.innerHTML)||(u.innerHTML=h.__html),t.__k=[];else if(p&&(u.innerHTML=""),L("template"==t.type?u.content:u,g(v)?v:[v],t,i,r,"foreignObject"==x?"http://www.w3.org/1999/xhtml":o,e,f,e?e[0]:i.__k&&$(i,0),c,a),null!=e)for(s=e.length;s--;)b(e[s]);c&&"textarea"!=x||(s="value","progress"==x&&null==w?u.removeAttribute("value"):null!=w&&(w!==u[s]||"progress"==x&&!w||"option"==x&&w!=m[s])&&N(u,s,w,m[s],o),s="checked",null!=_&&_!=u[s]&&N(u,s,_,m[s],o))}return u}function J(n,u,t){try{if("function"==typeof n){var i="function"==typeof n.__u;i&&n.__u(),i&&null==u||(n.__u=n(u))}else n.current=u}catch(n){l.__e(n,t)}}function K(n,u,t){var i,r;if(l.unmount&&l.unmount(n),(i=n.ref)&&(i.current&&i.current!=n.__e||J(i,null,u)),null!=(i=n.__c)){if(i.componentWillUnmount)try{i.componentWillUnmount()}catch(n){l.__e(n,u)}i.base=i.__P=null}if(i=n.__k)for(r=0;r<i.length;r++)i[r]&&K(i[r],u,t||"function"!=typeof n.type);t||b(n.__e),n.__c=n.__=n.__e=void 0}function Q(n,l,u){return this.constructor(n,u)}function R(u,t,i){var r,o,e,f;t==document&&(t=document.documentElement),l.__&&l.__(u,t),o=(r="function"==typeof i)?null:i&&i.__k||t.__k,e=[],f=[],q(t,u=(!r&&i||t).__k=k(S,null,[u]),o||d,d,t.namespaceURI,!r&&i?[i]:o?null:t.firstChild?n.call(t.childNodes):null,e,!r&&i?i:o?o.__e:t.firstChild,r,f),D(e,u,f)}function U(n,l){R(n,l,U)}function W(l,u,t){var i,r,o,e,f=m({},l.props);for(o in l.type&&l.type.defaultProps&&(e=l.type.defaultProps),u)"key"==o?i=u[o]:"ref"==o?r=u[o]:f[o]=void 0===u[o]&&null!=e?e[o]:u[o];return arguments.length>2&&(f.children=arguments.length>3?n.call(arguments,2):t),x(l.type,f,i||l.key,r||l.ref,null)}function X(n){function l(n){var u,t;return this.getChildContext||(u=new Set,(t={})[l.__c]=this,this.getChildContext=function(){return t},this.componentWillUnmount=function(){u=null},this.shouldComponentUpdate=function(n){this.props.value!=n.value&&u.forEach(function(n){n.__e=!0,A(n)})},this.sub=function(n){u.add(n);var l=n.componentWillUnmount;n.componentWillUnmount=function(){u&&u.delete(n),l&&l.call(n)}}),n.children}return l.__c="__cC"+y++,l.__=n,l.Provider=l.__l=(l.Consumer=function(n,l){return n.children(l)}).contextType=l,l}n=w.slice,l={__e:function(n,l,u,t){for(var i,r,o;l=l.__;)if((i=l.__c)&&!i.__)try{if((r=i.constructor)&&null!=r.getDerivedStateFromError&&(i.setState(r.getDerivedStateFromError(n)),o=i.__d),null!=i.componentDidCatch&&(i.componentDidCatch(n,t||{}),o=i.__d),o)return i.__E=i}catch(l){n=l}throw n}},u=0,t=function(n){return null!=n&&void 0===n.constructor},C.prototype.setState=function(n,l){var u;u=null!=this.__s&&this.__s!=this.state?this.__s:this.__s=m({},this.state),"function"==typeof n&&(n=n(m({},u),this.props)),n&&m(u,n),null!=n&&this.__v&&(l&&this._sb.push(l),A(this))},C.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),A(this))},C.prototype.render=S,i=[],o="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,e=function(n,l){return n.__v.__b-l.__v.__b},H.__r=0,f=Math.random().toString(8),c="__d"+f,a="__a"+f,s=/(PointerCapture)$|Capture$/i,h=0,p=V(!1),v=V(!0),y=0;
//# sourceMappingURL=preact.module.js.map


/***/ },

/***/ "./node_modules/preact/hooks/dist/hooks.module.js"
/*!********************************************************!*\
  !*** ./node_modules/preact/hooks/dist/hooks.module.js ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useCallback: () => (/* binding */ q),
/* harmony export */   useContext: () => (/* binding */ x),
/* harmony export */   useDebugValue: () => (/* binding */ P),
/* harmony export */   useEffect: () => (/* binding */ y),
/* harmony export */   useErrorBoundary: () => (/* binding */ b),
/* harmony export */   useId: () => (/* binding */ g),
/* harmony export */   useImperativeHandle: () => (/* binding */ F),
/* harmony export */   useLayoutEffect: () => (/* binding */ _),
/* harmony export */   useMemo: () => (/* binding */ T),
/* harmony export */   useReducer: () => (/* binding */ h),
/* harmony export */   useRef: () => (/* binding */ A),
/* harmony export */   useState: () => (/* binding */ d)
/* harmony export */ });
/* harmony import */ var preact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! preact */ "./node_modules/preact/dist/preact.module.js");
var t,r,u,i,o=0,f=[],c=preact__WEBPACK_IMPORTED_MODULE_0__.options,e=c.__b,a=c.__r,v=c.diffed,l=c.__c,m=c.unmount,s=c.__;function p(n,t){c.__h&&c.__h(r,n,o||t),o=0;var u=r.__H||(r.__H={__:[],__h:[]});return n>=u.__.length&&u.__.push({}),u.__[n]}function d(n){return o=1,h(D,n)}function h(n,u,i){var o=p(t++,2);if(o.t=n,!o.__c&&(o.__=[i?i(u):D(void 0,u),function(n){var t=o.__N?o.__N[0]:o.__[0],r=o.t(t,n);t!==r&&(o.__N=[r,o.__[1]],o.__c.setState({}))}],o.__c=r,!r.__f)){var f=function(n,t,r){if(!o.__c.__H)return!0;var u=o.__c.__H.__.filter(function(n){return n.__c});if(u.every(function(n){return!n.__N}))return!c||c.call(this,n,t,r);var i=o.__c.props!==n;return u.some(function(n){if(n.__N){var t=n.__[0];n.__=n.__N,n.__N=void 0,t!==n.__[0]&&(i=!0)}}),c&&c.call(this,n,t,r)||i};r.__f=!0;var c=r.shouldComponentUpdate,e=r.componentWillUpdate;r.componentWillUpdate=function(n,t,r){if(this.__e){var u=c;c=void 0,f(n,t,r),c=u}e&&e.call(this,n,t,r)},r.shouldComponentUpdate=f}return o.__N||o.__}function y(n,u){var i=p(t++,3);!c.__s&&C(i.__H,u)&&(i.__=n,i.u=u,r.__H.__h.push(i))}function _(n,u){var i=p(t++,4);!c.__s&&C(i.__H,u)&&(i.__=n,i.u=u,r.__h.push(i))}function A(n){return o=5,T(function(){return{current:n}},[])}function F(n,t,r){o=6,_(function(){if("function"==typeof n){var r=n(t());return function(){n(null),r&&"function"==typeof r&&r()}}if(n)return n.current=t(),function(){return n.current=null}},null==r?r:r.concat(n))}function T(n,r){var u=p(t++,7);return C(u.__H,r)&&(u.__=n(),u.__H=r,u.__h=n),u.__}function q(n,t){return o=8,T(function(){return n},t)}function x(n){var u=r.context[n.__c],i=p(t++,9);return i.c=n,u?(null==i.__&&(i.__=!0,u.sub(r)),u.props.value):n.__}function P(n,t){c.useDebugValue&&c.useDebugValue(t?t(n):n)}function b(n){var u=p(t++,10),i=d();return u.__=n,r.componentDidCatch||(r.componentDidCatch=function(n,t){u.__&&u.__(n,t),i[1](n)}),[i[0],function(){i[1](void 0)}]}function g(){var n=p(t++,11);if(!n.__){for(var u=r.__v;null!==u&&!u.__m&&null!==u.__;)u=u.__;var i=u.__m||(u.__m=[0,0]);n.__="P"+i[0]+"-"+i[1]++}return n.__}function j(){for(var n;n=f.shift();){var t=n.__H;if(n.__P&&t)try{t.__h.some(z),t.__h.some(B),t.__h=[]}catch(r){t.__h=[],c.__e(r,n.__v)}}}c.__b=function(n){r=null,e&&e(n)},c.__=function(n,t){n&&t.__k&&t.__k.__m&&(n.__m=t.__k.__m),s&&s(n,t)},c.__r=function(n){a&&a(n),t=0;var i=(r=n.__c).__H;i&&(u===r?(i.__h=[],r.__h=[],i.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(i.__h.some(z),i.__h.some(B),i.__h=[],t=0)),u=r},c.diffed=function(n){v&&v(n);var t=n.__c;t&&t.__H&&(t.__H.__h.length&&(1!==f.push(t)&&i===c.requestAnimationFrame||((i=c.requestAnimationFrame)||w)(j)),t.__H.__.some(function(n){n.u&&(n.__H=n.u),n.u=void 0})),u=r=null},c.__c=function(n,t){t.some(function(n){try{n.__h.some(z),n.__h=n.__h.filter(function(n){return!n.__||B(n)})}catch(r){t.some(function(n){n.__h&&(n.__h=[])}),t=[],c.__e(r,n.__v)}}),l&&l(n,t)},c.unmount=function(n){m&&m(n);var t,r=n.__c;r&&r.__H&&(r.__H.__.some(function(n){try{z(n)}catch(n){t=n}}),r.__H=void 0,t&&c.__e(t,r.__v))};var k="function"==typeof requestAnimationFrame;function w(n){var t,r=function(){clearTimeout(u),k&&cancelAnimationFrame(t),setTimeout(n)},u=setTimeout(r,35);k&&(t=requestAnimationFrame(r))}function z(n){var t=r,u=n.__c;"function"==typeof u&&(n.__c=void 0,u()),r=t}function B(n){var t=r;n.__c=n.__(),r=t}function C(n,t){return!n||n.length!==t.length||t.some(function(t,r){return t!==n[r]})}function D(n,t){return"function"==typeof t?t(n):t}
//# sourceMappingURL=hooks.module.js.map


/***/ },

/***/ "./node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js"
/*!*******************************************************************!*\
  !*** ./node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js ***!
  \*******************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fragment: () => (/* reexport safe */ preact__WEBPACK_IMPORTED_MODULE_0__.Fragment),
/* harmony export */   jsx: () => (/* binding */ u),
/* harmony export */   jsxAttr: () => (/* binding */ l),
/* harmony export */   jsxDEV: () => (/* binding */ u),
/* harmony export */   jsxEscape: () => (/* binding */ s),
/* harmony export */   jsxTemplate: () => (/* binding */ a),
/* harmony export */   jsxs: () => (/* binding */ u)
/* harmony export */ });
/* harmony import */ var preact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! preact */ "./node_modules/preact/dist/preact.module.js");
var t=/["&<]/;function n(r){if(0===r.length||!1===t.test(r))return r;for(var e=0,n=0,o="",f="";n<r.length;n++){switch(r.charCodeAt(n)){case 34:f="&quot;";break;case 38:f="&amp;";break;case 60:f="&lt;";break;default:continue}n!==e&&(o+=r.slice(e,n)),o+=f,e=n+1}return n!==e&&(o+=r.slice(e,n)),o}var o=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,f=0,i=Array.isArray;function u(e,t,n,o,i,u){t||(t={});var a,c,p=t;if("ref"in p)for(c in p={},t)"ref"==c?a=t[c]:p[c]=t[c];var l={type:e,props:p,key:n,ref:a,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--f,__i:-1,__u:0,__source:i,__self:u};if("function"==typeof e&&(a=e.defaultProps))for(c in a)void 0===p[c]&&(p[c]=a[c]);return preact__WEBPACK_IMPORTED_MODULE_0__.options.vnode&&preact__WEBPACK_IMPORTED_MODULE_0__.options.vnode(l),l}function a(r){var t=u(preact__WEBPACK_IMPORTED_MODULE_0__.Fragment,{tpl:r,exprs:[].slice.call(arguments,1)});return t.key=t.__v,t}var c={},p=/[A-Z]/g;function l(e,t){if(preact__WEBPACK_IMPORTED_MODULE_0__.options.attr){var f=preact__WEBPACK_IMPORTED_MODULE_0__.options.attr(e,t);if("string"==typeof f)return f}if(t=function(r){return null!==r&&"object"==typeof r&&"function"==typeof r.valueOf?r.valueOf():r}(t),"ref"===e||"key"===e)return"";if("style"===e&&"object"==typeof t){var i="";for(var u in t){var a=t[u];if(null!=a&&""!==a){var l="-"==u[0]?u:c[u]||(c[u]=u.replace(p,"-$&").toLowerCase()),s=";";"number"!=typeof a||l.startsWith("--")||o.test(l)||(s="px;"),i=i+l+":"+a+s}}return e+'="'+n(i)+'"'}return null==t||!1===t||"function"==typeof t||"object"==typeof t?"":!0===t?e:e+'="'+n(""+t)+'"'}function s(r){if(null==r||"boolean"==typeof r||"function"==typeof r)return null;if("object"==typeof r){if(void 0===r.constructor)return r;if(i(r)){for(var e=0;e<r.length;e++)r[e]=s(r[e]);return r}}return n(""+r)}
//# sourceMappingURL=jsxRuntime.module.js.map


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************************!*\
  !*** ./extension/src/popup/index.tsx ***!
  \***************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! preact/jsx-runtime */ "./node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js");
/* harmony import */ var preact__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! preact */ "./node_modules/preact/dist/preact.module.js");
/* harmony import */ var preact_hooks__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! preact/hooks */ "./node_modules/preact/hooks/dist/hooks.module.js");



const API_BASE = 'https://fitsyou-web.vercel.app';
// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
    pink: '#FF2E88',
    pinkDark: '#D1246E',
    pinkLight: '#FFE0ED',
    ink: '#121212',
    bone: '#F5F2EC',
    surface: '#FFFFFF',
    muted: '#9A9690',
    faint: '#C4C0BA',
    border: 'rgba(18,18,18,0.10)',
};
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'DM Sans', system-ui, sans-serif";
const MONO = "'DM Mono', monospace";
// ─── Helpers ─────────────────────────────────────────────────────────────────
function storeName(url) {
    try {
        const parts = new URL(url).hostname.split('.');
        const ccSld = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'ne', 'me']);
        const sld = parts[parts.length - 2];
        return (ccSld.has(sld) && parts.length >= 3 ? parts[parts.length - 3] : sld) ?? '';
    }
    catch {
        return '';
    }
}
const R2_PREFIXES = ['wardrobe/', 'try-ons/', 'user-photos/', 'user-faces/', 'product-images/'];
function authKeyFor(src) {
    try {
        const key = new URL(src).pathname.replace(/^\//, '');
        return R2_PREFIXES.some((p) => key.startsWith(p)) ? key : null;
    }
    catch {
        return null;
    }
}
async function getToken() {
    return new Promise((resolve) => chrome.storage.local.get(['fitsyou_token'], (items) => resolve(items['fitsyou_token'])));
}
async function callFit(token, payload) {
    try {
        const res = await fetch(`${API_BASE}/api/fit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        if (!res.ok)
            return null;
        return (await res.json());
    }
    catch {
        return null;
    }
}
async function saveWishlistItem(token, payload) {
    try {
        const res = await fetch(`${API_BASE}/api/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({ error: 'Save failed' }));
        if (!res.ok)
            return { error: json.error ?? `Error ${res.status}` };
        return { ok: true };
    }
    catch {
        return { error: 'Network error — please try again.' };
    }
}
async function fetchList(token, path) {
    try {
        const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok)
            return [];
        const json = (await res.json());
        return json.items ?? [];
    }
    catch {
        return [];
    }
}
const TIER_LIMITS = { free: 5, pro: 20, power: 100, atelier: Infinity };
const FIT_BADGE = {
    good: { label: 'Good fit', bg: '#dcfce7', fg: '#166534' },
    borderline: { label: 'Borderline', bg: '#fef9c3', fg: '#854d0e' },
    poor: { label: "Won't fit", bg: '#fee2e2', fg: '#991b1b' },
    unknown: { label: 'Fit unknown', bg: C.pinkLight, fg: C.pinkDark },
};
// ─── Sub-components ───────────────────────────────────────────────────────────
function AuthImg({ src, token, alt, style, }) {
    const [resolved, setResolved] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)(null);
    (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
        let revoke = null;
        if (!src) {
            setResolved(null);
            return;
        }
        const key = authKeyFor(src);
        if (!key) {
            setResolved(src);
            return;
        }
        fetch(`${API_BASE}/api/image?key=${encodeURIComponent(key)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.blob() : null))
            .then((blob) => {
            if (blob) {
                revoke = URL.createObjectURL(blob);
                setResolved(revoke);
            }
        })
            .catch(() => setResolved(null));
        return () => { if (revoke)
            URL.revokeObjectURL(revoke); };
    }, [src, token]);
    if (!resolved) {
        return (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { ...style, background: C.faint, borderRadius: '8px', flexShrink: 0 } });
    }
    return (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("img", { src: resolved, alt: alt, style: { ...style, flexShrink: 0 } });
}
function Spinner() {
    return ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { display: 'flex', justifyContent: 'center', padding: '20px 0' }, children: (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                width: '28px', height: '28px', borderRadius: '50%',
                border: `3px solid ${C.pinkLight}`, borderTopColor: C.pink,
                animation: 'spin 0.7s linear infinite',
            } }) }));
}
function Hint({ children }) {
    return (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { style: { fontSize: '13px', color: C.muted, lineHeight: 1.5, marginBottom: '14px', fontFamily: SANS }, children: children });
}
function StoreTag({ name }) {
    return ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
            fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em',
            textTransform: 'uppercase', color: C.pinkDark, marginBottom: '2px',
        }, children: name }));
}
// ─── Main popup ──────────────────────────────────────────────────────────────
function Popup() {
    const [status, setStatus] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)('checking');
    const [menu, setMenu] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)('home');
    const [message, setMessage] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)('');
    const [token, setToken] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)('');
    const [currentTabUrl, setCurrentTabUrl] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)('');
    const [fit, setFit] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)(null);
    const [wishlist, setWishlist] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)([]);
    const [wardrobe, setWardrobe] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)([]);
    const [tryOns, setTryOns] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)([]);
    const [listsLoaded, setListsLoaded] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
    const [generatedImages, setGeneratedImages] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)([]);
    const [progress, setProgress] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)(0);
    const [triesLeft, setTriesLeft] = (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useState)(null);
    async function checkAuth() {
        const tk = await getToken();
        if (!tk) {
            setStatus('signed-out');
            return;
        }
        setToken(tk);
        try {
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                headers: { Authorization: `Bearer ${tk}` },
            });
            if (res.status === 401) {
                chrome.storage.local.remove(['fitsyou_token', 'fitsyou_refresh_token']);
                setStatus('signed-out');
                return;
            }
            const profile = await res.json();
            if (profile?.try_on_count_this_month !== undefined) {
                const tier = profile.subscription_tier ?? 'free';
                const limit = TIER_LIMITS[tier] ?? 5;
                setTriesLeft(Math.max(0, limit - (profile.try_on_count_this_month ?? 0)));
            }
            setStatus(!profile?.photo_url ? 'needs-setup' : 'idle');
        }
        catch {
            setStatus('signed-out');
        }
    }
    (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
        checkAuth();
        const onChange = (changes) => {
            if ('fitsyou_token' in changes)
                checkAuth();
        };
        chrome.storage.onChanged.addListener(onChange);
        return () => chrome.storage.onChanged.removeListener(onChange);
    }, []);
    (0,preact_hooks__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
        if (status === 'idle' && token && !listsLoaded)
            loadLists(token);
    }, [status, token, listsLoaded]);
    async function loadLists(tk) {
        const [w, c, to] = await Promise.all([
            fetchList(tk, '/api/wishlist'),
            fetchList(tk, '/api/wardrobe'),
            fetchList(tk, '/api/try-ons'),
        ]);
        setWishlist(w);
        setWardrobe(c);
        setTryOns(to);
        setListsLoaded(true);
    }
    function openTab(path) {
        const url = new URL(`${API_BASE}${path}`);
        url.searchParams.set('extensionId', chrome.runtime.id);
        chrome.tabs.create({ url: url.toString() });
    }
    async function extractProduct() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id)
            return null;
        setCurrentTabUrl(tab.url ?? '');
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT' }, (resp) => {
                if (chrome.runtime.lastError || !resp) {
                    resolve(null);
                    return;
                }
                resolve(resp);
            });
        });
    }
    // ── Add to wishlist flow ──────────────────────────────────────────────────
    async function handleAddToWishlist() {
        setStatus('extracting');
        const ext = await extractProduct();
        if (!ext) {
            setStatus('error');
            setMessage('Refresh this page, then click again. If it keeps failing, this store may not be supported yet.');
            return;
        }
        if (!ext.success || !ext.imageUrl) {
            setStatus('manual');
            return;
        }
        const tk = (await getToken()) ?? token;
        if (!tk) {
            setStatus('signed-out');
            return;
        }
        setStatus('checking-fit');
        setFit(null);
        const fitResult = await callFit(tk, {
            product_title: ext.productTitle ?? null,
            size_chart_text: ext.sizeChartText,
            available_sizes: ext.availableSizes,
            selected_size: ext.selectedSize,
        });
        setFit(fitResult);
        setStatus('saving');
        const saved = await saveWishlistItem(tk, {
            product_url: currentTabUrl,
            product_image_url: ext.imageUrl,
            product_title: ext.productTitle ?? null,
            store_name: storeName(currentTabUrl),
            available_sizes: ext.availableSizes,
            fit_verdict: fitResult?.verdict ?? null,
            recommended_size: fitResult?.recommended_size ?? null,
        });
        if ('error' in saved) {
            setStatus('error');
            setMessage(saved.error);
            return;
        }
        setMessage(ext.productTitle ?? 'Added to your wishlist');
        setListsLoaded(false);
        setStatus('saved');
    }
    // ── Try-on generation ─────────────────────────────────────────────────────
    async function runGeneration(productUrl, productImageUrl) {
        setGeneratedImages([]);
        setProgress(0);
        setStatus('generating');
        const tk = (await getToken()) ?? token;
        if (!tk) {
            setStatus('signed-out');
            return;
        }
        let prog = 0;
        const timer = setInterval(() => {
            prog = Math.min(prog + 4, 88);
            setProgress(prog);
        }, 500);
        try {
            const res = await fetch(`${API_BASE}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
                body: JSON.stringify({ product_url: productUrl, product_image_url: productImageUrl }),
            });
            clearInterval(timer);
            setProgress(100);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setStatus('error');
                setMessage(err.error ?? `Generation failed (${res.status})`);
                return;
            }
            const data = await res.json();
            setGeneratedImages(data.output_image_urls ?? []);
            setTriesLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
            setListsLoaded(false);
            setStatus('generated');
        }
        catch {
            clearInterval(timer);
            setStatus('error');
            setMessage('Network error — please try again.');
        }
    }
    async function handleTryOnFromPage() {
        setStatus('extracting');
        const ext = await extractProduct();
        if (!ext) {
            setStatus('error');
            setMessage('Refresh this page, then click again.');
            return;
        }
        if (!ext.success || !ext.imageUrl) {
            setStatus('manual');
            return;
        }
        await runGeneration(currentTabUrl, ext.imageUrl);
    }
    // ── Manual upload ─────────────────────────────────────────────────────────
    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setStatus('saving');
        const tk = (await getToken()) ?? token;
        if (!tk) {
            setStatus('signed-out');
            return;
        }
        const form = new FormData();
        form.append('file', file);
        let productImageUrl;
        try {
            const up = await fetch(`${API_BASE}/api/upload-product-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tk}` },
                body: form,
            });
            if (!up.ok)
                throw new Error();
            productImageUrl = (await up.json()).url;
        }
        catch {
            setStatus('error');
            setMessage('Failed to upload product image.');
            return;
        }
        const productUrl = currentTabUrl || `manual-upload-${Date.now()}`;
        const saved = await saveWishlistItem(tk, {
            product_url: productUrl,
            product_image_url: productImageUrl,
            store_name: currentTabUrl ? storeName(currentTabUrl) : undefined,
        });
        if ('error' in saved) {
            setStatus('error');
            setMessage(saved.error);
            return;
        }
        setMessage('Added to your wishlist');
        setListsLoaded(false);
        setStatus('saved');
    }
    // ─── Render ───────────────────────────────────────────────────────────────
    return ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { width: '360px', fontFamily: SANS, background: C.bone, color: C.ink }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                    background: C.ink, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontFamily: SERIF, fontSize: '22px', color: C.bone, lineHeight: 1 }, children: ["fits", (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("em", { style: { color: C.pink, fontStyle: 'italic' }, children: "you" })] }), triesLeft !== null && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                            fontFamily: MONO, fontSize: '10px', color: C.pink,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                        }, children: [triesLeft, " tries left"] }))] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { padding: '16px' }, children: [status === 'checking' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { textAlign: 'center', padding: '24px 0' }, children: (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {}) })), status === 'signed-out' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '12px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontFamily: SERIF, fontSize: '22px', marginBottom: '8px' }, children: ["Welcome to fits", (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("em", { style: { color: C.pink, fontStyle: 'italic' }, children: "you" })] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "Sign in to try clothes on yourself and save looks you love." }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/auth/extension'), style: btnPink, children: "Sign in to fitsyou" })] })), status === 'needs-setup' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '12px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontFamily: SERIF, fontSize: '20px', marginBottom: '8px' }, children: "Almost ready" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "Upload your photo once and start trying on clothes from any store." }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/onboarding/photo'), style: btnPink, children: "Complete setup" })] })), status === 'idle' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                    display: 'flex', gap: '1px',
                                    borderBottom: `1px solid ${C.border}`, marginBottom: '14px',
                                }, children: ['home', 'wishlist', 'wardrobe', 'tryons'].map((m) => {
                                    const labels = {
                                        home: 'Home',
                                        wishlist: wishlist.length ? `Saved (${wishlist.length})` : 'Saved',
                                        wardrobe: wardrobe.length ? `Wardrobe (${wardrobe.length})` : 'Wardrobe',
                                        tryons: tryOns.length ? `Try-ons (${tryOns.length})` : 'Try-ons',
                                    };
                                    const active = menu === m;
                                    return ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setMenu(m), style: {
                                            flex: 1, padding: '8px 3px',
                                            fontSize: '10px', fontWeight: active ? 600 : 400,
                                            color: active ? C.pink : C.muted,
                                            background: 'transparent', border: 'none',
                                            borderBottom: `2px solid ${active ? C.pink : 'transparent'}`,
                                            marginBottom: '-1px', cursor: 'pointer',
                                            fontFamily: MONO, letterSpacing: '0.04em',
                                            textTransform: 'uppercase', transition: 'color 0.15s',
                                        }, children: labels[m] }, m));
                                }) }), menu === 'home' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "Browse any fashion store and try items on yourself \u2014 right here, without leaving the page." }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleTryOnFromPage, style: { ...btnPink, marginBottom: '8px' }, children: "Try this on me" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleAddToWishlist, style: { ...btnInk, marginBottom: '8px' }, children: "+ Add to wishlist" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard?tab=fitting-room'), style: btnGhost, children: "Open Fitting Room \u2192" })] })), menu === 'wishlist' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { children: !listsLoaded ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})) : wishlist.length === 0 ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '16px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "No saved items yet. Browse a store and add something." }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setMenu('home'), style: btnPink, children: "Find something \u2192" })] })) : ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }, children: wishlist.map((item) => ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                            background: C.surface, borderRadius: '10px', padding: '10px',
                                            border: `0.5px solid ${C.border}`,
                                        }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { display: 'flex', gap: '10px', alignItems: 'flex-start' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(AuthImg, { src: item.product_image_url, token: token, alt: item.product_title ?? 'Item', style: { width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' } }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [item.store_name && (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(StoreTag, { name: item.store_name }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                                                    fontSize: '12px', fontWeight: 600, color: C.ink,
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                }, children: item.product_title ?? 'Untitled item' }), item.fit_verdict && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontSize: '10px', color: (FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).fg, marginTop: '2px' }, children: [(FIT_BADGE[item.fit_verdict] ?? FIT_BADGE.unknown).label, item.recommended_size ? ` · ${item.recommended_size}` : ''] }))] })] }), item.product_image_url && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => runGeneration(item.product_url, item.product_image_url), style: { ...btnPinkSmall, marginTop: '8px', width: '100%' }, children: "Try this on me" }))] }, item.id))) })) })), menu === 'wardrobe' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { children: !listsLoaded ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})) : wardrobe.length === 0 ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '16px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "No wardrobe items yet. Add your own clothes on the dashboard." }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard?tab=wardrobe'), style: btnInk, children: "Add your clothes \u2192" })] })) : ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                                                maxHeight: '380px', overflowY: 'auto',
                                            }, children: wardrobe.map((item) => ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                                    background: C.surface, borderRadius: '10px',
                                                    border: `0.5px solid ${C.border}`, overflow: 'hidden',
                                                }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(AuthImg, { src: item.image_url, token: token, alt: item.name ?? 'Item', style: { width: '100%', height: '110px', objectFit: 'contain', background: C.bone, display: 'block' } }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { padding: '6px 8px 8px' }, children: [item.category && (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(StoreTag, { name: item.category }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                                                    fontSize: '11px', fontWeight: 600, color: C.ink,
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                }, children: item.name ?? 'Untitled' })] })] }, item.id))) }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard?tab=fitting-room'), style: { ...btnGhost, marginTop: '10px', width: '100%' }, children: "Open Fitting Room \u2192" })] })) })), menu === 'tryons' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { children: !listsLoaded ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})) : tryOns.length === 0 ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '16px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "No try-ons yet. Visit a store page and hit \"Try this on me\"." }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setMenu('home'), style: btnPink, children: "Try something on" })] })) : ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                                                maxHeight: '380px', overflowY: 'auto',
                                            }, children: tryOns.slice(0, 8).map((item) => ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                                    background: C.surface, borderRadius: '10px',
                                                    border: `0.5px solid ${C.border}`, overflow: 'hidden',
                                                }, children: [item.output_image_urls?.[0] ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { position: 'relative' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(AuthImg, { src: item.output_image_urls[0], token: token, alt: item.product_title ?? 'Try-on', style: { width: '100%', height: '120px', objectFit: 'cover', display: 'block' } }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                                                    position: 'absolute', bottom: '4px', right: '6px',
                                                                    fontFamily: SERIF, fontSize: '9px', color: C.surface, opacity: 0.9,
                                                                }, children: ["fits", (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("em", { style: { color: C.pink, fontStyle: 'italic' }, children: "you" })] })] })) : ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { height: '120px', background: C.bone } })), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { padding: '6px 8px 8px' }, children: [item.store_name && (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(StoreTag, { name: item.store_name }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                                                    fontSize: '11px', fontWeight: 600, color: C.ink,
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                }, children: item.product_title ?? 'Try-on' })] })] }, item.id))) }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard'), style: { ...btnGhost, marginTop: '10px', width: '100%' }, children: "View all on dashboard \u2192" })] })) }))] })), status === 'extracting' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '20px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }, children: "Finding product\u2026" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "Scanning the page for the product image" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})] })), status === 'checking-fit' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '20px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }, children: "Checking fit\u2026" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})] })), status === 'generating' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { padding: '20px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', marginBottom: '18px' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontFamily: SERIF, fontSize: '19px', marginBottom: '5px' }, children: ["Composing your try-", (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("em", { style: { color: C.pink, fontStyle: 'italic' }, children: "on" }), "\u2026"] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontSize: '12px', color: C.muted }, children: "Usually takes 8\u201315 seconds" })] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { background: C.surface, borderRadius: '6px', overflow: 'hidden', height: '5px', marginBottom: '4px' }, children: (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                        height: '100%',
                                        background: `linear-gradient(90deg, ${C.pink}, ${C.pinkDark})`,
                                        width: `${progress}%`,
                                        transition: 'width 0.5s ease',
                                        borderRadius: '6px',
                                    } }) }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontFamily: MONO, fontSize: '10px', color: C.muted, textAlign: 'right', marginBottom: '12px' }, children: [progress, "%"] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})] })), status === 'generated' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontFamily: SERIF, fontSize: '19px', marginBottom: '12px' }, children: ["Your try-", (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("em", { style: { color: C.pink, fontStyle: 'italic' }, children: "on" })] }), generatedImages.length > 0 ? ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: generatedImages.length === 1 ? '1fr' : '1fr 1fr',
                                    gap: '8px', marginBottom: '14px',
                                }, children: generatedImages.map((url, i) => ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { position: 'relative', borderRadius: '10px', overflow: 'hidden' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(AuthImg, { src: url, token: token, alt: `Try-on variant ${i + 1}`, style: {
                                                width: '100%',
                                                height: generatedImages.length === 1 ? '300px' : '190px',
                                                objectFit: 'cover', display: 'block',
                                            } }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                                position: 'absolute', bottom: '7px', right: '9px',
                                                fontFamily: SERIF, fontSize: '11px',
                                                color: C.surface, opacity: 0.92,
                                                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                            }, children: ["fits", (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("em", { style: { color: C.pink, fontStyle: 'italic' }, children: "you" })] })] }, i))) })) : ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Hint, { children: "Try-on generated! View it on your dashboard." })), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard'), style: { ...btnInk, marginBottom: '8px' }, children: "View on dashboard" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => { setGeneratedImages([]); setMenu('tryons'); setStatus('idle'); }, style: btnGhost, children: "Done" })] })), status === 'saving' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { textAlign: 'center', padding: '20px 0' }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontFamily: SERIF, fontSize: '17px', marginBottom: '6px' }, children: "Saving\u2026" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Spinner, {})] })), status === 'saved' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [fit && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                    background: (FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown).bg,
                                    color: (FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown).fg,
                                    borderRadius: '10px', padding: '10px 12px', marginBottom: '10px',
                                }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: { fontSize: '13px', fontWeight: 700 }, children: [(FIT_BADGE[fit.verdict] ?? FIT_BADGE.unknown).label, fit.recommended_size ? ` · size ${fit.recommended_size}` : ''] }), fit.reason && (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontSize: '12px', marginTop: '3px', lineHeight: 1.4 }, children: fit.reason }), fit.needs_measurements && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard'), style: { marginTop: '6px', background: 'none', border: 'none', padding: 0, fontSize: '12px', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', color: 'inherit' }, children: "Add measurements \u2192" }))] })), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                    background: C.surface, borderRadius: '10px', padding: '12px',
                                    marginBottom: '12px', border: `0.5px solid ${C.border}`,
                                }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontFamily: MONO, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#166534', marginBottom: '3px' }, children: "\u2713 Saved to wishlist" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontSize: '13px', color: C.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: message })] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => openTab('/dashboard?tab=fitting-room'), style: { ...btnPink, marginBottom: '8px' }, children: "Build an outfit \u2192" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => { setFit(null); setMenu('wishlist'); setStatus('idle'); }, style: btnInk, children: "Done" })] })), status === 'error' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: {
                                    background: '#fee2e2', color: '#991b1b', borderRadius: '10px',
                                    padding: '12px', marginBottom: '12px', fontSize: '13px', lineHeight: 1.45,
                                }, children: message }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setStatus('idle'), style: btnInk, children: "\u2190 Back" })] })), status === 'manual' && ((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { style: {
                                    background: C.surface, borderRadius: '10px', padding: '14px',
                                    marginBottom: '12px', border: `0.5px solid ${C.border}`,
                                }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontFamily: SERIF, fontSize: '16px', marginBottom: '5px' }, children: "Can't detect image" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { style: { fontSize: '12px', color: C.muted, lineHeight: 1.5 }, children: "Screenshot the item and upload it below to save it to your wishlist." })] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { style: {
                                    display: 'block', border: `1.5px dashed ${C.pink}`, borderRadius: '10px',
                                    padding: '18px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px',
                                }, children: [(0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontSize: '22px', marginBottom: '4px' }, children: "\uD83D\uDCF7" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { style: { fontSize: '12px', color: C.pinkDark, fontWeight: 600 }, children: "Tap to upload screenshot" }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onChange: handleFileUpload, style: { display: 'none' } })] }), (0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setStatus('idle'), style: btnInk, children: "\u2190 Back" })] }))] })] }));
}
// ─── Style constants ──────────────────────────────────────────────────────────
const btnPink = {
    display: 'block', width: '100%', padding: '12px 16px',
    background: C.pink, color: C.surface, border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
    letterSpacing: '-0.01em',
};
const btnInk = {
    display: 'block', width: '100%', padding: '12px 16px',
    background: C.ink, color: C.bone, border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
    letterSpacing: '-0.01em',
};
const btnGhost = {
    display: 'block', width: '100%', padding: '10px 16px',
    background: 'transparent', color: C.pinkDark,
    border: `1px solid ${C.pink}`, borderRadius: '10px',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: SANS,
};
const btnPinkSmall = {
    display: 'block', padding: '7px 12px',
    background: C.pink, color: C.surface, border: 'none', borderRadius: '7px',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
};
(0,preact__WEBPACK_IMPORTED_MODULE_1__.render)((0,preact_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(Popup, {}), document.getElementById('app'));

})();

/******/ })()
;
//# sourceMappingURL=popup.js.map
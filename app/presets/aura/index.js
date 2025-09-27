import accordion from './accordion/index.js';
import accordioncontent from './accordioncontent/index.js';
import accordionheader from './accordionheader/index.js';
import accordionpanel from './accordionpanel/index.js';
import autocomplete from './autocomplete/index.js';
// import avatar from './avatar';
// import avatargroup from './avatargroup';
// import badge from './badge';
// import badgedirective from './badgedirective';
// import blockui from './blockui';
// import breadcrumb from './breadcrumb';
import button from './button/index.js';
import buttongroup from './buttongroup/index.js';
// import card from './card';
// import carousel from './carousel';
// import cascadeselect from './cascadeselect';
import checkbox from './checkbox/index.js';
import chip from './chip/index.js';
// import colorpicker from './colorpicker';
// import confirmdialog from './confirmdialog';
// import confirmpopup from './confirmpopup';
// import contextmenu from './contextmenu';
import datatable from './datatable/index.js';
// import dataview from './dataview';
import datepicker from './datepicker/index.js';
// import deferred from './deferred';
import dialog from './dialog/index.js';
import divider from './divider/index.js';
// import dock from './dock';
import drawer from './drawer/index.js';
// import fieldset from './fieldset';
// import fileupload from './fileupload';
// import floatlabel from './floatlabel';
// import galleria from './galleria';
import global from './global.js';
import iconfield from './iconfield/index.js';
// import image from './image';
// import inplace from './inplace';
import inputgroup from './inputgroup/index.js';
import inputgroupaddon from './inputgroupaddon/index.js';
// import inputmask from './inputmask';
// import inputnumber from './inputnumber';
import inputotp from './inputotp/index.js';
import inputtext from './inputtext/index.js';
// import knob from './knob';
// import listbox from './listbox';
// import megamenu from './megamenu';
// import menu from './menu';
// import menubar from './menubar';
import message from './message/index.js';
// import metergroup from './metergroup';
// import multiselect from './multiselect';
// import orderlist from './orderlist';
// import organizationchart from './organizationchart';
// import overlaybadge from './overlaybadge';
import paginator from './paginator/index.js';
// import panel from './panel';
// import panelmenu from './panelmenu';
// import password from './password';
// import picklist from './picklist';
import popover from './popover/index.js';
// import progressbar from './progressbar';
// import progressspinner from './progressspinner';
// import radiobutton from './radiobutton';
// import rating from './rating';
// import ripple from './ripple';
// import scrollpanel from './scrollpanel';
// import scrolltop from './scrolltop';
import select from './select/index.js';
import selectbutton from './selectbutton/index.js';
import skeleton from './skeleton/index.js';
// import slider from './slider';
// import speeddial from './speeddial';
// import splitbutton from './splitbutton';
// import splitter from './splitter';
// import splitterpanel from './splitterpanel';
import step from './step/index.js';
import stepitem from './stepitem/index.js';
import steplist from './steplist/index.js';
import steppanels from './steppanels/index.js';
import stepper from './stepper/index.js';
import steps from './steps/index.js';
import tab from './tab/index.js';
import tablist from './tablist/index.js';
import tabmenu from './tabmenu/index.js';
import tabpanel from './tabpanel/index.js';
import tabpanels from './tabpanels/index.js';
import tabs from './tabs/index.js';
import tabview from './tabview/index.js';
import tag from './tag/index.js';
// import terminal from './terminal';
// import textarea from './textarea';
import tieredmenu from './tieredmenu/index.js';
// import timeline from './timeline';
import toast from './toast/index.js';
import togglebutton from './togglebutton/index.js';
import toggleswitch from './toggleswitch/index.js';
// import toolbar from './toolbar';
import tooltip from './tooltip/index.js';
// import tree from './tree';
// import treeselect from './treeselect';
// import treetable from './treetable';

export default {
	global,
	directives: {
		// badge: badgedirective,
		// ripple,
		tooltip,
	},

	// forms
	autocomplete,
	select,
	dropdown: select,
	// inputnumber,
	inputtext,
	datepicker,
	calendar: datepicker,
	checkbox,
	// radiobutton,
	toggleswitch,
	// inputswitch: toggleswitch,
	selectbutton,
	// slider,
	// rating,
	// multiselect,
	togglebutton,
	// cascadeselect,
	// listbox,
	// colorpicker,
	inputgroup,
	inputgroupaddon,
	// inputmask,
	// knob,
	// treeselect,
	// textarea,
	// password,
	iconfield,
	// floatlabel,
	inputotp,

	// buttons
	button,
	buttongroup,
	// splitbutton,
	// speeddial,

	// data
	paginator,
	datatable,
	// tree,
	// dataview,
	// organizationchart,
	// orderlist,
	// picklist,
	// treetable,
	// timeline,

	// panels
	accordion,
	accordionpanel,
	accordionheader,
	accordioncontent,
	// panel,
	// fieldset,
	// card,
	tabview,
	divider,
	toolbar,
	// scrollpanel,
	// splitter,
	// splitterpanel,
	stepper,
	steplist,
	step,
	stepitem,
	steppanels,
	// deferred,
	tab,
	tabs,
	tablist,
	tabpanels,
	tabpanel,

	// file
	// fileupload,

	// menu
	// contextmenu,
	// menu,
	menubar,
	steps,
	tieredmenu,
	// breadcrumb,
	// panelmenu,
	// megamenu,
	// dock,
	tabmenu,

	// overlays
	dialog,
	popover,
	// sidebar: popover,
	drawer,
	// overlaypanel: drawer,
	// confirmpopup,
	// confirmdialog,

	// messages
	message,
	toast,

	// media
	// carousel,
	// galleria,
	// image,

	// misc
	// badge,
	// overlaybadge,
	// avatar,
	// avatargroup,
	tag,
	chip,
	// progressbar,
	skeleton,
	// scrolltop,
	// terminal,
	// blockui,
	// metergroup,
	// inplace,
	// progressspinner,
};

import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import heroBannerUrl from "../hero-banner.png";
import successQrImageUrl from "../success-qr.jpg";
import { EventAdminDashboard, EventDashboard, JuryAdminDashboard, JuryScoringPage, ProjectAdminPage, ProjectSubmissionPage, VotingPage } from "./event-system";
import "./styles.css";

type AudiencePayload = {
  type: "audience";
  name: string;
  province: string;
  city: string;
  email: string;
  phone: string;
  wechat: string;
  media: string;
  contestantFormSubmitted: string;
  day: string;
  count: string;
  note: string;
  momentGoal: string;
  herstoryLevel: string;
  hshhSource: string;
  builderEcosystemCoCreate: string;
  nextSteps: string[];
  consent: string[];
  contactPrefs: string[];
};

type RegistrationRecord = AudiencePayload & {
  id: string;
  status: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  checkedInAt?: string | null;
};

type AppConfig = {
  successQrUrl: string;
};

const apiBase = import.meta.env.VITE_API_BASE || "";
const draftKey = "hshh-audience-draft-v3";

const defaultForm: AudiencePayload = {
  type: "audience",
  name: "",
  province: "",
  city: "",
  email: "",
  phone: "",
  wechat: "",
  media: "",
  contestantFormSubmitted: "",
  day: "",
  count: "",
  note: "",
  momentGoal: "",
  herstoryLevel: "",
  hshhSource: "",
  builderEcosystemCoCreate: "",
  nextSteps: [],
  consent: [],
  contactPrefs: [],
};

const cityOptions: Record<string, string[]> = {
  北京市: ["北京市"],
  天津市: ["天津市"],
  上海市: ["上海市"],
  重庆市: ["重庆市"],
  河北省: ["石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", "保定市", "张家口市", "承德市", "沧州市", "廊坊市", "衡水市"],
  山西省: ["太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市", "忻州市", "临汾市", "吕梁市"],
  内蒙古自治区: ["呼和浩特市", "包头市", "乌海市", "赤峰市", "通辽市", "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市", "乌兰察布市", "兴安盟", "锡林郭勒盟", "阿拉善盟"],
  辽宁省: ["沈阳市", "大连市", "鞍山市", "抚顺市", "本溪市", "丹东市", "锦州市", "营口市", "阜新市", "辽阳市", "盘锦市", "铁岭市", "朝阳市", "葫芦岛市"],
  吉林省: ["长春市", "吉林市", "四平市", "辽源市", "通化市", "白山市", "松原市", "白城市", "延边朝鲜族自治州"],
  黑龙江省: ["哈尔滨市", "齐齐哈尔市", "鸡西市", "鹤岗市", "双鸭山市", "大庆市", "伊春市", "佳木斯市", "七台河市", "牡丹江市", "黑河市", "绥化市", "大兴安岭地区"],
  江苏省: ["南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市", "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市", "宿迁市"],
  浙江省: ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"],
  安徽省: ["合肥市", "芜湖市", "蚌埠市", "淮南市", "马鞍山市", "淮北市", "铜陵市", "安庆市", "黄山市", "滁州市", "阜阳市", "宿州市", "六安市", "亳州市", "池州市", "宣城市"],
  福建省: ["福州市", "厦门市", "莆田市", "三明市", "泉州市", "漳州市", "南平市", "龙岩市", "宁德市"],
  江西省: ["南昌市", "景德镇市", "萍乡市", "九江市", "新余市", "鹰潭市", "赣州市", "吉安市", "宜春市", "抚州市", "上饶市"],
  山东省: ["济南市", "青岛市", "淄博市", "枣庄市", "东营市", "烟台市", "潍坊市", "济宁市", "泰安市", "威海市", "日照市", "临沂市", "德州市", "聊城市", "滨州市", "菏泽市"],
  河南省: ["郑州市", "开封市", "洛阳市", "平顶山市", "安阳市", "鹤壁市", "新乡市", "焦作市", "濮阳市", "许昌市", "漯河市", "三门峡市", "南阳市", "商丘市", "信阳市", "周口市", "驻马店市", "济源市"],
  湖北省: ["武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市", "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市", "恩施土家族苗族自治州", "仙桃市", "潜江市", "天门市", "神农架林区"],
  湖南省: ["长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市", "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市", "娄底市", "湘西土家族苗族自治州"],
  广东省: ["广州市", "韶关市", "深圳市", "珠海市", "汕头市", "佛山市", "江门市", "湛江市", "茂名市", "肇庆市", "惠州市", "梅州市", "汕尾市", "河源市", "阳江市", "清远市", "东莞市", "中山市", "潮州市", "揭阳市", "云浮市"],
  广西壮族自治区: ["南宁市", "柳州市", "桂林市", "梧州市", "北海市", "防城港市", "钦州市", "贵港市", "玉林市", "百色市", "贺州市", "河池市", "来宾市", "崇左市"],
  海南省: ["海口市", "三亚市", "三沙市", "儋州市", "五指山市", "琼海市", "文昌市", "万宁市", "东方市", "定安县", "屯昌县", "澄迈县", "临高县", "白沙黎族自治县", "昌江黎族自治县", "乐东黎族自治县", "陵水黎族自治县", "保亭黎族苗族自治县", "琼中黎族苗族自治县"],
  四川省: ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市", "阿坝藏族羌族自治州", "甘孜藏族自治州", "凉山彝族自治州"],
  贵州省: ["贵阳市", "六盘水市", "遵义市", "安顺市", "毕节市", "铜仁市", "黔西南布依族苗族自治州", "黔东南苗族侗族自治州", "黔南布依族苗族自治州"],
  云南省: ["昆明市", "曲靖市", "玉溪市", "保山市", "昭通市", "丽江市", "普洱市", "临沧市", "楚雄彝族自治州", "红河哈尼族彝族自治州", "文山壮族苗族自治州", "西双版纳傣族自治州", "大理白族自治州", "德宏傣族景颇族自治州", "怒江傈僳族自治州", "迪庆藏族自治州"],
  西藏自治区: ["拉萨市", "日喀则市", "昌都市", "林芝市", "山南市", "那曲市", "阿里地区"],
  陕西省: ["西安市", "铜川市", "宝鸡市", "咸阳市", "渭南市", "延安市", "汉中市", "榆林市", "安康市", "商洛市"],
  甘肃省: ["兰州市", "嘉峪关市", "金昌市", "白银市", "天水市", "武威市", "张掖市", "平凉市", "酒泉市", "庆阳市", "定西市", "陇南市", "临夏回族自治州", "甘南藏族自治州"],
  青海省: ["西宁市", "海东市", "海北藏族自治州", "黄南藏族自治州", "海南藏族自治州", "果洛藏族自治州", "玉树藏族自治州", "海西蒙古族藏族自治州"],
  宁夏回族自治区: ["银川市", "石嘴山市", "吴忠市", "固原市", "中卫市"],
  新疆维吾尔自治区: ["乌鲁木齐市", "克拉玛依市", "吐鲁番市", "哈密市", "昌吉回族自治州", "博尔塔拉蒙古自治州", "巴音郭楞蒙古自治州", "阿克苏地区", "克孜勒苏柯尔克孜自治州", "喀什地区", "和田地区", "伊犁哈萨克自治州", "塔城地区", "阿勒泰地区", "石河子市", "阿拉尔市", "图木舒克市", "五家渠市", "北屯市", "铁门关市", "双河市", "可克达拉市", "昆玉市", "胡杨河市"],
  香港特别行政区: ["香港"],
  澳门特别行政区: ["澳门"],
  台湾省: ["台北市", "新北市", "桃园市", "台中市", "台南市", "高雄市", "基隆市", "新竹市", "嘉义市"],
};

const provinceOptions = Object.keys(cityOptions);

const dayOptions = [
  "8 月 14 日｜赛事开幕式 / 主办方致辞（50名）",
  "8 月 15 日｜女性硬件 founder 圆桌 - 2pm（50名）",
  "8 月 16 日｜选手路演 / 评审 / 投票环节（50名）",
];
const momentOptions = ["看完整场 Demo，找灵感", "看路演，学 Pitch 结构", "找队友，聊下届组队", "找合作方，谈资源对接", "认识某个嘉宾 / 导师", "拍素材，回去二次创作", "体验，放松一下", "其她"];
const herstoryLevelOptions = ["非常熟悉，是 0xHerstory 社群活跃成员", "知道一些，参加过活动或关注过", "听说过，但不太了解", "第一次听说"];
const hshhSourceOptions = ["0xHerstory 科技社群", "朋友推荐", "Builder 推荐", "HsHH 小红书", "抖音、小红书、公众号刷到活动信息", "其她"];
const builderEcosystemCoCreateOptions = ["非常愿意，想长期共建", "愿意，想先从活动 / 社群参与开始", "感兴趣，但想先了解更多", "暂时不确定，先保持关注"];
const contestantFormSubmittedOptions = ["是", "否"];
const nextStepOptions = ["我想参加 AI 硬件共学", "我想报名下一届 Builder", "我有项目，想招募队友", "我想成为志愿者", "我可以提供技术或导师支持", "我代表企业，希望洽谈合作", "我是投资人 / 媒体，希望了解项目", "目前只是想保持关注"];
const contactPrefOptions = ["重要活动通知", "项目资源对接", "社群活动邀请", "志愿者 / 共创机会", "合作 / 赞助 / 媒体联系", "不希望被频繁联系"];
const consentOptions = ["我同意遵守 HsHH 尊重与安全规范", "我同意接收报名与活动通知", "我同意活动官方将现场照片/视频用于后续宣传"];

const requiredGroups: Array<keyof AudiencePayload> = ["nextSteps", "contactPrefs"];

const eventStats = [
  ["3", "days"],
  ["50", "seats / day"],
  ["女性硬件", "builder ecosystem"],
  ["上海", "8.14 - 8.16"],
] as const;

const scheduleItems = [
  {
    day: "Day 0 · 8/14",
    title: "开幕式与 48 小时计时开始",
    body: "14:00 签到入场，15:00 开幕式与机制说明，16:00 进入自由开发与现场组队。",
    capacity: "开幕观众席 50 名",
  },
  {
    day: "Day 1 · 8/15",
    title: "导师巡场与女性硬件 Founder 圆桌",
    body: "导师答疑、工程师巡场、团队开发继续推进，下午沉淀硬件创业与长期建设经验。",
    capacity: "圆桌观众席 50 名",
  },
  {
    day: "Day 2 · 8/16",
    title: "Demo 冻结、路演评审与颁奖",
    body: "16:00 提交截止，16:30 开始路演与评审，晚间完成颁奖、合影和自由交流。",
    capacity: "路演观众席 50 名",
  },
] as const;

const guideFacts = [
  ["活动形式", "线下黑客松 / 限时开发 / Demo 展示 / 现场交流"],
  ["参赛对象", "已报名并通过确认的女性 Builder"],
  ["建议组队", "2-5 人协作，也欢迎 solo 参赛"],
  ["现场规模", "100+ 选手 / 100+ 观众 / 约 50 位评审导师嘉宾与工作人员"],
] as const;

const builderPrinciples = [
  ["真实需求", "从真实体验、生活场景或未被满足的需求出发。"],
  ["开放路径", "软件、硬件原型、软硬结合、服务设计、表达型作品都可以。"],
  ["跨域协作", "鼓励 AI、硬件、产品、设计、表达等多角色组成完整团队。"],
  ["造物落地", "不止做 Demo，也关注想法能否被制造、被使用、被推广。"],
  ["后续连接", "优秀项目可继续获得制造支持、供应链对接与社区共创机会。"],
] as const;

const creationDirections = ["看见人的需求", "理解人的生活", "创造人的连接", "让人的想象成为现实"] as const;

const judgingCriteria = [
  ["人本价值", "是否回应真实需求，关怀具体人群。"],
  ["技术实现", "是否完成核心功能，技术路径是否合理。"],
  ["创新价值", "方案是否具有新颖性、差异化或独特视角。"],
  ["产品体验", "Demo 是否可展示、可理解、可体验。"],
  ["产品化潜力", "是否具备后续迭代、落地或扩展潜力。"],
  ["表达与故事", "Pitch 是否清晰，能否有效传达项目价值。"],
] as const;

const awardCards = [
  ["海智智造专项奖", "总计 3-10 万元梦想成真券，最高单项目 5 万元打样额度，并提供工程会诊与制造支持。"],
  ["涂鸦智能专项奖", "围绕 AIoT 生态融合、创新应用、人本设计，提供硬件礼包、开发权益和生态资源。"],
  ["得捷电子闪耀女创客奖", "共 6 个获奖名额，提供购物卡与 DigiKey 采购金，关注技术、创新、社群与女性力量。"],
  ["参赛即享福利", "HER Hack-Astron 周边与数字权益、Magic Compute AI 模型 Token、现场女性友好物资。"],
] as const;

const fieldNotes = [
  ["地点", "上海市徐汇区虹漕路 421 号虹漕大楼，海智智造・漕河泾。"],
  ["造物支持", "现场含 500㎡ 造物工坊、3D 打印机、基础造物设备及驻场工程师。"],
  ["休息与健康", "夜间开放休息区，场地配备基础医药箱、经期互助盒与夜间巡护。"],
  ["携带建议", "电脑、充电器、转接头、备用网络、个人用品、常用药和 Demo 展示线材。"],
] as const;

const builderFaq = [
  ["没有队伍怎么办？", "可以现场组队，也可以提前在选手群交流想法。"],
  ["必须用现场硬件吗？", "不强制。纯软件、硬件、软硬结合、服务设计或表达型作品都可以。"],
  ["Demo 一定要完整吗？", "不要求商业级完成度，但需要尽量做出可展示、可解释、可体验的核心原型。"],
  ["硬件调试失败怎么办？", "建议提前准备录屏、截图、模拟 Demo 或降级版本作为备用展示方案。"],
] as const;

const archiveCards = [
  ["赛事叙事", "从开幕、共创到路演，持续沉淀女性硬件创造者的现场记录。"],
  ["项目索引", "整理 builder 作品、硬件方向、资源需求与可对接能力。"],
  ["资源网络", "汇总工坊、供应链、导师、媒体、社区与合作方生态。"],
  ["志愿者贡献", "记录每位志愿者在现场支持、内容整理、传播协作中的实际贡献。"],
] as const;

const volunteers = [
  { name: "Eddie梁", groups: ["技术组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "lovisa", groups: ["录像"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "摄影录像" },
  { name: "恩雅", note: "后勤负责人", groups: ["现场执行组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "zizi", note: "场地负责人", groups: ["现场执行组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "糖糖", note: "物料负责人", groups: ["市场组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "Forres", groups: ["内容品牌组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "杨佳怡", groups: ["内容品牌组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "谢雨晴", groups: ["社群社媒运营组", "现场执行组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "nia", groups: ["市场组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "lydia", groups: ["摄影"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "摄影" },
  { name: "Gale", note: "赛事负责人", groups: ["统筹策划组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "陈佳佳", note: "赛事负责人", groups: ["统筹策划组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "小熙", groups: ["统筹策划组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "江江", groups: ["录像"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "高添添", note: "Weus 合作", groups: ["合作支持"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "合作支持" },
  { name: "佩儿", note: "Weus 合作", groups: ["合作支持"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "合作支持" },
  { name: "potato", groups: ["市场组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "Ting", groups: ["内容品牌组"], mode: "线下全程跟进", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "Annabelle", groups: ["内容品牌组", "摄影"], mode: "综合线上+线下 24h", days: ["8月14日", "8月15日", "8月16日"], status: "已分配" },
  { name: "闻镜", groups: ["社群社媒运营组"], mode: "综合线上+线下 24h", days: ["8月15日", "8月16日"], status: "已分配" },
  { name: "Octal", groups: ["社群社媒运营组"], mode: "综合线上+线下 24h", days: ["8月14日", "8月16日"], status: "已分配" },
  { name: "Becky", groups: ["机动组"], mode: "待确认", days: [], status: "已联系" },
  { name: "Jenny", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "Joie", groups: ["现场执行组"], mode: "待确认", days: [], status: "待确认" },
  { name: "july", groups: ["内容品牌组"], mode: "待确认", days: [], status: "已联系" },
  { name: "vivi", groups: ["社群社媒运营组"], mode: "待确认", days: [], status: "待确认" },
  { name: "吃吃", groups: ["社群社媒运营组"], mode: "待确认", days: [], status: "待确认" },
  { name: "灵/Annabelle", groups: ["内容品牌组"], mode: "待确认", days: [], status: "已分配" },
  { name: "依琳", groups: ["技术组"], mode: "待确认", days: [], status: "待确认" },
  { name: "清翎屿", groups: ["社群社媒运营组"], mode: "待确认", days: [], status: "待确认" },
  { name: "瑶瑶", groups: ["社群社媒运营组"], mode: "待确认", days: [], status: "待确认" },
  { name: "Michelle", groups: ["内容品牌组"], mode: "待确认", days: [], status: "待确认" },
  { name: "十三", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "杨宇凤", groups: ["现场执行组"], mode: "待确认", days: [], status: "待确认" },
  { name: "郭瀛marinelle", groups: ["机动组"], mode: "线下支持", days: [], status: "已联系" },
  { name: "冯瑶", groups: ["内容品牌组"], mode: "待确认", days: [], status: "待确认" },
  { name: "啥啥", groups: ["社群社媒运营组"], mode: "待确认", days: [], status: "待确认" },
  { name: "顾茅欢", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "苒苒", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "贝拉", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "周和", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "斯嘉", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "牡蛎/Hannah", groups: ["选手支持"], mode: "选手报名", days: [], status: "报名了选手" },
  { name: "江昕", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "周鱼", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "Iris", groups: ["机动组"], mode: "待确认", days: [], status: "待确认" },
  { name: "Bala", note: "创始人 / 评委", groups: ["评委支持"], mode: "评委", days: [], status: "嘉宾评委" },
] as const;

const contributionRows = [
  ["统筹策划组", "3 人", "赛事节奏、现场流程、组委协调"],
  ["现场执行组", "5 人", "签到、场地、后勤、现场秩序与突发支持"],
  ["内容品牌组", "8 人", "图文沉淀、现场记录、官网内容与传播素材"],
  ["社群社媒运营组", "8 人", "社群联络、社媒发布、观众触达与反馈收集"],
  ["市场组", "3 人", "合作沟通、物料支持、品牌与现场资源协调"],
  ["摄影 / 录像", "4 人", "照片、录像、活动素材采集与归档"],
  ["技术组", "2 人", "网站、报名系统、数据后台与技术支持"],
  ["合作 / 评委 / 选手支持", "4 人", "合作方、评委与选手侧支持协作"],
  ["机动组", "11 人", "灵活支援现场临时任务与后续角色确认"],
] as const;

const volunteerGroupOrder = [
  "统筹策划组",
  "现场执行组",
  "内容品牌组",
  "社群社媒运营组",
  "市场组",
  "摄影",
  "录像",
  "技术组",
  "合作支持",
  "评委支持",
  "选手支持",
  "机动组",
] as const;

const volunteerGroupNotes: Record<string, string> = {
  统筹策划组: "赛事节奏与全局协调",
  现场执行组: "现场秩序与后勤支持",
  内容品牌组: "内容沉淀与品牌表达",
  社群社媒运营组: "社群联络与传播触达",
  市场组: "市场合作与物料协同",
  摄影: "照片记录与视觉素材",
  录像: "动态影像与现场记录",
  技术组: "网站系统与技术支持",
  合作支持: "合作方现场协作",
  评委支持: "评审嘉宾支持",
  选手支持: "选手侧支持与连接",
  机动组: "灵活支援与现场机动",
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data as T;
}

function useConfig() {
  const [config, setConfig] = useState<AppConfig>({ successQrUrl: "" });
  useEffect(() => {
    void api<AppConfig>("/api/config").then(setConfig).catch(() => setConfig({ successQrUrl: "" }));
  }, []);
  return config;
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      {props.children}
    </div>
  );
}

function QuestionCard(props: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="qa-card">
      <div className="qa-head">
        <h3>{props.title}</h3>
        {props.description ? <p>{props.description}</p> : null}
      </div>
      {props.children}
    </div>
  );
}

function Section(props: { index: string; title: string; description?: string; lead?: boolean; children: React.ReactNode }) {
  return (
    <section className={classNames("section", props.lead && "section--lead")}>
      <div className="section-head">
        <div className="section-head__text">
          <div className="index">{props.index}</div>
          <h2>{props.title}</h2>
          {props.description ? <p>{props.description}</p> : null}
        </div>
        <div className="section-badge">{props.index.slice(0, 2)}</div>
      </div>
      {props.children}
    </section>
  );
}

function RadioGroup(props: { name: keyof AudiencePayload; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return (
    <div className="qa-options">
      {props.options.map((option, index) => (
        <label className="choice" key={option}>
          <input type="radio" name={String(props.name)} value={option} checked={props.value === option} onChange={() => props.onChange(option)} required={props.required && index === 0} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup(props: { name: keyof AudiencePayload; values: string[]; options: string[]; onChange: (values: string[]) => void; columns?: "two" | "three"; required?: boolean }) {
  const toggle = (option: string) => {
    props.onChange(props.values.includes(option) ? props.values.filter((item) => item !== option) : [...props.values, option]);
  };
  return (
    <div className={classNames(props.columns === "three" ? "grid-3" : "grid-2", "choices")}>
      {props.options.map((option) => (
        <label className="choice" key={option}>
          <input type="checkbox" name={String(props.name)} value={option} checked={props.values.includes(option)} onChange={() => toggle(option)} />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function valueText(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join("、") : "未填写";
  const text = String(value || "").trim();
  return text || "未填写";
}

function cleanTextInput(value: string, maxLength = 80) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, maxLength);
}

function cleanCompactInput(value: string, maxLength = 80) {
  return cleanTextInput(value, maxLength).replace(/\s+/g, "");
}

function cleanWechatInput(value: string) {
  return cleanCompactInput(value, 40);
}

function cleanPhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function cleanNumberInput(value: string, max = 5) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return String(Math.min(Number(digits), max));
}

function splitStoredCity(value: string) {
  const [province = "", city = ""] = value.split(" · ");
  return { province, city };
}

function previewFields(data: Partial<RegistrationRecord>) {
  return [
    ["姓名/昵称", data.name],
    ["所在省份", data.province],
    ["所在城市", data.city],
    ["联系邮箱", data.email],
    ["微信号", data.wechat],
    ["手机号", data.phone],
    ["社交媒体账号", data.media],
    ["是否填写过选手报名表", data.contestantFormSubmitted],
    ["计划到场时间", data.day],
    ["同行人数", data.count],
    ["补充说明", data.note],
    ["本场最想收获", data.momentGoal],
    ["Herstory 了解程度", data.herstoryLevel],
    ["HsHH 来源", data.hshhSource],
    ["是否希望持续共建女性硬件 Builder 生态", data.builderEcosystemCoCreate],
    ["后续参与方向", data.nextSteps],
    ["授权确认", data.consent],
    ["后续联系偏好", data.contactPrefs],
  ] as const;
}

function PreviewDrawer(props: { data: Partial<RegistrationRecord> | null; onClose: () => void }) {
  return (
    <div className={classNames("preview-drawer", props.data ? "open" : false)} aria-hidden={!props.data}>
      <aside className="preview-panel" role="dialog" aria-modal="true" aria-labelledby="previewTitle">
        <div className="preview-head">
          <h2 id="previewTitle">答案预览</h2>
          <button className="preview-close" type="button" onClick={props.onClose}>关闭</button>
        </div>
        <dl className="preview-list">
          {props.data
            ? previewFields(props.data).map(([label, value]) => {
                const formatted = valueText(value);
                return (
                  <div className={classNames("preview-item", formatted !== "未填写" && "is-filled")} key={label}>
                    <dt>{label}</dt>
                    <dd>{formatted}</dd>
                  </div>
                );
              })
            : null}
        </dl>
      </aside>
    </div>
  );
}

function RecordLookupModal(props: { open: boolean; onClose: () => void; onFound: (record: RegistrationRecord) => void }) {
  const [values, setValues] = useState({ name: "", email: "", wechat: "", phone: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.open) setMessage("");
  }, [props.open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const lookupValues = { ...values, wechat: cleanWechatInput(values.wechat) };
      const record = await api<RegistrationRecord>("/api/lookup", {
        method: "POST",
        body: JSON.stringify(lookupValues),
      });
      props.onClose();
      props.onFound(record);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "没有找到匹配的报名记录");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classNames("record-drawer", props.open && "open")} aria-hidden={!props.open}>
      <section className="record-panel" role="dialog" aria-modal="true" aria-labelledby="recordTitle">
        <div className="record-head">
          <h2 id="recordTitle">查询报名记录</h2>
        </div>
        <form className="record-body" onSubmit={submit}>
          <p className="record-desc">请输入报名时填写的四项信息。四项全部一致时，系统会显示此前提交的报名内容。</p>
          <Field label="姓名 / 昵称">
            <input value={values.name} onChange={(event) => setValues({ ...values, name: cleanTextInput(event.target.value, 40) })} placeholder="报名时填写的姓名或昵称" required />
          </Field>
          <Field label="联系邮箱">
            <input type="email" value={values.email} onChange={(event) => setValues({ ...values, email: cleanCompactInput(event.target.value, 80).toLowerCase() })} placeholder="name@example.com" required />
          </Field>
          <Field label="微信号">
            <input
              value={values.wechat}
              onChange={(event) => setValues({ ...values, wechat: cleanTextInput(event.target.value, 40) })}
              onBlur={() => setValues((current) => ({ ...current, wechat: cleanWechatInput(current.wechat) }))}
              placeholder="报名时填写的微信号"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </Field>
          <Field label="手机号">
            <input type="tel" inputMode="numeric" maxLength={11} pattern="^1[3-9]\d{9}$" value={values.phone} onChange={(event) => setValues({ ...values, phone: cleanPhoneInput(event.target.value) })} placeholder="报名时填写的手机号" required />
          </Field>
          <div className="record-message" aria-live="polite">{message}</div>
          <div className="record-actions">
            <button className="btn" type="button" onClick={props.onClose}>关闭</button>
            <button className="btn primary" type="submit" disabled={loading}>{loading ? "查询中" : "查询记录"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SubmitNoticeModal(props: { open: boolean; submitting: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className={classNames("notice-drawer", props.open && "open")} aria-hidden={!props.open}>
      <section className="notice-panel" role="dialog" aria-modal="true" aria-labelledby="noticeTitle">
        <div className="notice-head">
          <div className="lead-kicker">before.submit()</div>
          <h2 id="noticeTitle">报名须知</h2>
        </div>
        <div className="notice-body">
          <div className="notice-list">
            <p><strong>报名即视为确认出席</strong>，现场凭报名信息签到（无邮件通知）。</p>
            <p><strong>比赛现场地点</strong>：上海海智工业科技有限公司（虹漕路421号67幢）。</p>
          </div>
          <div className="notice-actions">
            <button className="btn" type="button" onClick={props.onClose} disabled={props.submitting}>返回修改</button>
            <button className="btn primary" type="button" onClick={props.onConfirm} disabled={props.submitting}>{props.submitting ? "提交中" : "已知晓，提交报名"}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SiteCredit() {
  return <footer className="site-credit">by 一点海椰 from HsHH</footer>;
}

function SiteNav() {
  return (
    <nav className="site-nav" aria-label="主导航">
      <a href="/">官网首页</a>
      <a href="/audience">观众报名</a>
      <a href="/volunteers">志愿者贡献</a>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="page audience-page">
      <header className="hero site-hero">
        <img className="hero-image" src={heroBannerUrl} alt="Herstory 女性硬件黑客松视觉图" />
      </header>
      <section className="section site-landing">
        <div className="lead-copy">
          <div className="lead-kicker">hshh.archive()</div>
          <h1 className="lead-title">Herstory 女性硬件黑客松</h1>
          <p className="lead-desc">HsHH 不是一场普通活动，而是一套正在生成的女性硬件 builder 生态记录：报名、现场、项目、资源、志愿者贡献，都会在这里持续沉淀。</p>
        </div>
        <div className="stat-grid">
          {eventStats.map(([value, label]) => (
            <div className="metric-card" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="hero-actions">
          <a className="btn primary inline-link" href="/audience">观众报名</a>
          <a className="btn inline-link" href="/volunteers">志愿者贡献</a>
        </div>
      </section>

      <Section index="01 / SCHEDULE" title="赛事日程" description="先把可公开的赛事骨架沉淀下来，后续可继续补充嘉宾、项目和现场内容。">
        <div className="timeline-grid">
          {scheduleItems.map((item) => (
            <article className="timeline-card" key={item.day}>
              <div className="timeline-day">{item.day}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <span>{item.capacity}</span>
            </article>
          ))}
        </div>
      </Section>

      <Section index="02 / GUIDE" title="Builder 参赛指南" description="从参赛选手手册提炼公开信息，让新观众、合作方和后续参与者快速理解 HsHH 如何运转。">
        <div className="guide-grid">
          {guideFacts.map(([title, body]) => (
            <article className="guide-card" key={title}>
              <span>{title}</span>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="guide-split block-gap">
          <article className="qa-card guide-panel">
            <div className="qa-head">
              <h3>这是一场什么样的黑客松？</h3>
              <p>HsHH 由 Herstory 社区发起，面向女性 AI 硬件创造者，尝试打通从想法、AI 硬件原型到制造落地的链路。</p>
            </div>
            <div className="tag-row guide-tags">
              {creationDirections.map((direction) => <span key={direction}>{direction}</span>)}
            </div>
          </article>
          <article className="qa-card guide-panel">
            <div className="qa-head">
              <h3>参赛作品需要回答什么？</h3>
              <p>妳们看见了什么问题、它影响谁、解决方案是什么、Demo 完成到什么程度，以及为什么值得继续发展。</p>
            </div>
          </article>
        </div>
        <div className="principle-grid block-gap">
          {builderPrinciples.map(([title, body]) => (
            <article className="principle-card" key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section index="03 / JUDGING" title="创作机制与奖项资源" description="赛事采用官方评分、十强作品池与合作方专项奖的阶梯评选方式。">
        <div className="criteria-grid">
          {judgingCriteria.map(([title, body]) => (
            <article className="qa-card criterion-card" key={title}>
              <div className="qa-head">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="submission-card block-gap">
          <div>
            <span>提交截止</span>
            <strong>8 月 16 日 16:00</strong>
          </div>
          <p>如作品依赖本地环境、硬件设备或外部 API，需要在提交说明里写清运行方式和展示方式。</p>
        </div>
        <div className="archive-grid block-gap">
          {awardCards.map(([title, body]) => (
            <article className="qa-card archive-card" key={title}>
              <div className="qa-head">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section index="04 / FIELD" title="现场指南" description="把选手手册里最常被问到的现场信息沉淀成官网入口，方便活动前后反复查询。">
        <div className="guide-grid">
          {fieldNotes.map(([title, body]) => (
            <article className="guide-card" key={title}>
              <span>{title}</span>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="faq-grid block-gap">
          {builderFaq.map(([question, answer]) => (
            <article className="qa-card faq-card" key={question}>
              <div className="qa-head">
                <h3>{question}</h3>
                <p>{answer}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section index="05 / ARCHIVE" title="内容沉淀" description="官网不是只放报名入口，而是把活动结束后仍然有价值的信息结构化留下。">
        <div className="archive-grid">
          {archiveCards.map(([title, body]) => (
            <article className="qa-card archive-card" key={title}>
              <div className="qa-head">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section index="06 / VOLUNTEERS" title="志愿者贡献" description="把幕后工作也变成可见、可感谢、可复盘的公共记录。">
        <div className="volunteer-strip">
          {volunteers.slice(0, 3).map((volunteer) => (
            <article className="volunteer-card" key={volunteer.name}>
              <div className="avatar-mark">{volunteer.name.slice(0, 1)}</div>
              <h3>{volunteer.name}</h3>
              <p>{volunteer.groups.join(" / ")}</p>
              <strong>{volunteer.status}</strong>
            </article>
          ))}
        </div>
        <div className="hero-actions">
          <a className="btn primary inline-link" href="/volunteers">查看志愿者贡献</a>
        </div>
      </Section>
      <SiteCredit />
    </div>
  );
}

function VolunteerContributionStats() {
  const fullTimeVolunteers = volunteers.filter((volunteer) => volunteer.mode.includes("全程")).length;
  return (
    <section className="section site-landing">
      <div className="lead-copy">
        <div className="lead-kicker">contribution.stats()</div>
        <h1 className="lead-title">志愿者贡献统计</h1>
        <p className="lead-desc">按组别沉淀志愿者贡献，不做积分排名，只让每一种幕后支持被看见、被感谢、可复盘。</p>
      </div>
      <div className="stat-grid">
        <div className="metric-card"><strong>{volunteers.length}</strong><span>志愿者</span></div>
        <div className="metric-card"><strong>{fullTimeVolunteers}</strong><span>全程跟进</span></div>
        <div className="metric-card"><strong>{contributionRows.length}</strong><span>贡献组别</span></div>
      </div>
    </section>
  );
}

function VolunteersPage() {
  const groupedVolunteers = volunteerGroupOrder
    .map((group) => ({ group, members: volunteers.filter((volunteer) => (volunteer.groups as readonly string[]).includes(group)) }))
    .filter((item) => item.members.length > 0);

  return (
    <div className="page site-page">
      <SiteNav />
      <VolunteerContributionStats />
      <div className="volunteer-group-stack">
        {groupedVolunteers.map(({ group, members }) => (
          <section className="volunteer-group" key={group}>
            <div className="volunteer-group__head">
              <div>
                <span>module // {group}</span>
                <h2>{volunteerGroupNotes[group]}</h2>
              </div>
              <span>{members.length} 人</span>
            </div>
            <div className="volunteer-grid">
              {members.map((volunteer) => (
                <article className="volunteer-card volunteer-card--large" key={`${group}-${volunteer.name}`}>
                  <div className="avatar-mark">{volunteer.name.slice(0, 1)}</div>
                  <h2>{volunteer.name}</h2>
                  {"note" in volunteer && volunteer.note ? <p>{volunteer.note}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <SiteCredit />
    </div>
  );
}

function VolunteerStatsPage() {
  return (
    <div className="page site-page">
      <SiteNav />
      <VolunteerContributionStats />
      <SiteCredit />
    </div>
  );
}

function AudienceForm() {
  const [form, setForm] = useState<AudiencePayload>(() => {
    try {
      const draft = { ...defaultForm, ...JSON.parse(localStorage.getItem(draftKey) || "{}") };
      if (!draft.province && draft.city) draft.province = splitStoredCity(draft.city).province;
      if (Array.isArray(draft.day)) draft.day = draft.day[0] || "";
      if (!draft.contestantFormSubmitted && draft.firstHackathonApplied) {
        draft.contestantFormSubmitted = String(draft.firstHackathonApplied).startsWith("是") ? "是" : String(draft.firstHackathonApplied).startsWith("否") ? "否" : "";
      }
      delete draft.firstHackathonApplied;
      delete draft.experiences;
      delete draft.ecosystem;
      delete draft.identity;
      delete draft.hardwareIdea;
      return draft;
    } catch {
      return defaultForm;
    }
  });
  const [toast, setToast] = useState("");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [preview, setPreview] = useState<Partial<RegistrationRecord> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [form]);

  const update = <K extends keyof AudiencePayload>(key: K, value: AudiencePayload[K]) => setForm((current) => ({ ...current, [key]: value }));
  const cityName = splitStoredCity(form.city).city;
  const selectedCities = form.province ? cityOptions[form.province] || [] : [];

  const completed = useMemo(() => {
    const requiredScalar: Array<keyof AudiencePayload> = ["name", "province", "city", "email", "phone", "wechat", "contestantFormSubmitted", "day", "momentGoal", "herstoryLevel", "hshhSource", "builderEcosystemCoCreate"];
    const scalarDone = requiredScalar.filter((key) => String(form[key] || "").trim()).length;
    const groupDone = requiredGroups.filter((key) => Array.isArray(form[key]) && (form[key] as string[]).length > 0).length;
    const consentDone = form.consent.includes(consentOptions[0]) && form.consent.includes(consentOptions[1]) ? 1 : 0;
    const total = requiredScalar.length + requiredGroups.length + 1;
    return Math.round(((scalarDone + groupDone + consentDone) / total) * 100);
  }, [form]);

  const validateClient = () => {
    const required = ["name", "province", "city", "email", "phone", "wechat", "contestantFormSubmitted", "day", "momentGoal", "herstoryLevel", "hshhSource", "builderEcosystemCoCreate"] as const;
    for (const key of required) {
      if (!String(form[key]).trim()) return "还有必填项未填";
    }
    for (const key of requiredGroups) {
      if (!Array.isArray(form[key]) || (form[key] as string[]).length === 0) return "还有必填项未填";
    }
    if (!form.consent.includes(consentOptions[0]) || !form.consent.includes(consentOptions[1])) return "请确认承诺与共识必选项";
    return "";
  };

  const requestSubmit = () => {
    const validationError = validateClient();
    if (validationError) {
      setToast(validationError);
      return;
    }
    setNoticeOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form, wechat: cleanWechatInput(form.wechat) };
      const response = await api<{ id: string; successUrl: string }>("/api/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      localStorage.removeItem(draftKey);
      window.location.assign(response.successUrl);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    requestSubmit();
  };

  return (
    <div className="page audience-page">
      <header className="hero">
        <img className="hero-image" src={heroBannerUrl} alt="HsHH 观众报名视觉图" />
      </header>
      <section className="form-zone">
        <div className="form-topline">
          <div className="progress-row" aria-label="填写进度">
            <span className="progress-label">{completed}% COMPLETE</span>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${completed}%` }} /></div>
            <div className="progress-buttons">
              <button className="btn" type="button" onClick={() => setPreview(form)}>预览答案</button>
              <button className="btn primary" type="button" onClick={() => setToast(validateClient() || "必填项已完成")}>检查必填</button>
            </div>
          </div>
        </div>
        <div className="content">
          <form className="sections" onSubmit={handleSubmit}>
            <section className="section section--lead">
              <div className="lead-copy">
                <div className="lead-kicker">application.form()</div>
                <h1 className="lead-title">HsHH 观众报名</h1>
                <p className="lead-desc">HsHH 不是一场普通的活动，而是一次「任她创造」的邀请。</p>
              </div>
              <div className="section-head">
                <div className="section-head__text">
                  <div className="index">01 / CONTACT</div>
                  <h2>基础资料</h2>
                </div>
                <div className="section-badge">01</div>
              </div>
              <div className="qa-stack">
                <QuestionCard title="联系方式与所在城市">
                  <div className="grid-2">
                    <Field label="姓名 / 昵称 *"><input value={form.name} onChange={(event) => update("name", cleanTextInput(event.target.value, 40))} placeholder="你的名字或昵称" required /></Field>
                    <Field label="所在省份 *">
                      <select value={form.province} onChange={(event) => { update("province", event.target.value); update("city", ""); }} required>
                        <option value="">请选择省份</option>
                        {provinceOptions.map((province) => <option key={province}>{province}</option>)}
                      </select>
                    </Field>
                    <Field label="所在城市 *">
                      <select value={cityName} onChange={(event) => update("city", form.province ? `${form.province} · ${event.target.value}` : "")} required disabled={!form.province}>
                        <option value="">{form.province ? "请选择城市" : "请先选择省份"}</option>
                        {selectedCities.map((city) => <option key={city}>{city}</option>)}
                      </select>
                    </Field>
                    <Field label="联系邮箱 *"><input type="email" value={form.email} onChange={(event) => update("email", cleanCompactInput(event.target.value, 80).toLowerCase())} placeholder="name@example.com" required /></Field>
                    <Field label="手机号 *"><input type="tel" inputMode="numeric" maxLength={11} pattern="^1[3-9]\d{9}$" value={form.phone} onChange={(event) => update("phone", cleanPhoneInput(event.target.value))} placeholder="13800000000" required /></Field>
                    <Field label="微信号 *">
                      <input
                        value={form.wechat}
                        onChange={(event) => update("wechat", cleanTextInput(event.target.value, 40))}
                        onBlur={() => update("wechat", cleanWechatInput(form.wechat))}
                        placeholder="用于活动联络"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                      />
                    </Field>
                    <Field label="社交媒体账号"><input value={form.media} onChange={(event) => update("media", cleanCompactInput(event.target.value, 120))} placeholder="小红书 / B站 / X / 其他链接" /></Field>
                  </div>
                </QuestionCard>
                <QuestionCard title="是否填写过选手报名表？ *">
                  <RadioGroup name="contestantFormSubmitted" value={form.contestantFormSubmitted} options={contestantFormSubmittedOptions} onChange={(value) => update("contestantFormSubmitted", value)} required />
                </QuestionCard>
              </div>
            </section>

            <Section index="02 / SCHEDULE" title="到场计划" description="请先选择妳最可能到场的时间，便于我们安排现场名额。">
              <div className="qa-stack">
                <div className="grid-2">
                  <QuestionCard title="计划到场时间 *" description="请选择一个最可能到场的时间"><RadioGroup name="day" value={form.day} options={dayOptions} onChange={(value) => update("day", value)} required /></QuestionCard>
                  <QuestionCard title="同行人数"><input type="number" min={0} max={5} value={form.count} onChange={(event) => update("count", cleanNumberInput(event.target.value, 5))} placeholder="0" /></QuestionCard>
                </div>
                <QuestionCard title="补充说明"><textarea value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="特殊需求、想找的搭子类型、想带的装备等" /></QuestionCard>
              </div>
            </Section>

            <Section index="03 / JOURNEY" title="参与旅程" description="HsHH 之后，妳想怎么继续跟 Herstory 和 HsHH 产生连接？">
              <div className="qa-stack">
                <QuestionCard title="这场活动，妳最想收获什么？ *" description="选择最接近妳这次到场目标的一项"><RadioGroup name="momentGoal" value={form.momentGoal} options={momentOptions} onChange={(value) => update("momentGoal", value)} required /></QuestionCard>
                <QuestionCard title="妳对 Herstory 的了解程度？ *"><RadioGroup name="herstoryLevel" value={form.herstoryLevel} options={herstoryLevelOptions} onChange={(value) => update("herstoryLevel", value)} required /></QuestionCard>
                <QuestionCard title="妳是怎么知道 HsHH 的？ *"><RadioGroup name="hshhSource" value={form.hshhSource} options={hshhSourceOptions} onChange={(value) => update("hshhSource", value)} required /></QuestionCard>
                <QuestionCard title="妳会希望和 HsHH：Herstory Hardware Hub 持续共建女性硬件 Builder 的生态吗？ *"><RadioGroup name="builderEcosystemCoCreate" value={form.builderEcosystemCoCreate} options={builderEcosystemCoCreateOptions} onChange={(value) => update("builderEcosystemCoCreate", value)} required /></QuestionCard>
                <QuestionCard title="活动结束后，妳下一步想参与什么？ *" description="可多选，我们会按妳的选择推送后续通道"><CheckboxGroup name="nextSteps" values={form.nextSteps} options={nextStepOptions} onChange={(values) => update("nextSteps", values)} /></QuestionCard>
                <QuestionCard title="承诺与授权">
                  <div className="choices">
                    {consentOptions.map((option, index) => (
                      <label className="choice" key={option}>
                        <input type="checkbox" checked={form.consent.includes(option)} onChange={() => update("consent", form.consent.includes(option) ? form.consent.filter((item) => item !== option) : [...form.consent, option])} />
                        <span>{option}{index < 2 ? " *" : ""}</span>
                      </label>
                    ))}
                  </div>
                </QuestionCard>
                <QuestionCard title="妳希望我们后续怎么联系妳？ *" description="可多选"><CheckboxGroup name="contactPrefs" values={form.contactPrefs} options={contactPrefOptions} onChange={(values) => update("contactPrefs", values)} /></QuestionCard>
              </div>
            </Section>
          </form>
        </div>
      </section>
      <div className="fixed-footer">
        <div className="fixed-footer__note">填写过程中会自动保存草稿，提交后将进入报名系统。</div>
        <div className="fixed-footer__actions">
          <button className="btn" type="button" onClick={() => setLookupOpen(true)}>查询报名记录</button>
          <button className="btn" type="button" onClick={() => { localStorage.removeItem(draftKey); setForm(defaultForm); setToast("草稿已清空"); }}>清空草稿</button>
          <button className="btn primary" type="button" onClick={requestSubmit} disabled={submitting}>{submitting ? "提交中" : "提交报名"}</button>
        </div>
      </div>
      <SubmitNoticeModal open={noticeOpen} submitting={submitting} onClose={() => setNoticeOpen(false)} onConfirm={() => void submit()} />
      <RecordLookupModal open={lookupOpen} onClose={() => setLookupOpen(false)} onFound={setPreview} />
      <PreviewDrawer data={preview} onClose={() => setPreview(null)} />
      <SiteCredit />
      <div className={classNames("toast", toast && "show")}>{toast}</div>
    </div>
  );
}

function SuccessPage({ id }: { id: string }) {
  const config = useConfig();
  const qrUrl = config.successQrUrl || successQrImageUrl;
  return (
    <div className="page page-narrow">
      <header className="hero"><img className="hero-image" src={heroBannerUrl} alt="HsHH 观众报名视觉图" /></header>
      <section className="section section--lead success-card">
        <div className="lead-copy">
          <div className="lead-kicker">registration.saved()</div>
          <h1 className="lead-title">报名成功</h1>
          <p className="lead-desc">妳的报名记录已保存。请截图保留本页，后续也可以用姓名、邮箱、微信号和手机号查询记录。</p>
        </div>
        <div className="success-grid">
          <div className="success-copy">
            <div className="choice-title">报名编号</div>
            <p className="success-id">{id}</p>
            <a className="btn primary inline-link" href="/audience">返回报名页</a>
          </div>
          <div className="qr-box">
            <img src={qrUrl} alt="报名成功二维码" />
          </div>
        </div>
      </section>
      <SiteCredit />
    </div>
  );
}

type AdminListResponse = {
  items: RegistrationRecord[];
  total: number;
  page: number;
  pageSize: number;
};

const adminColumns: Array<[string, keyof RegistrationRecord]> = [
  ["姓名", "name"],
  ["省份", "province"],
  ["城市", "city"],
  ["邮箱", "email"],
  ["手机", "phone"],
  ["微信", "wechat"],
  ["社媒", "media"],
  ["是否填写选手表", "contestantFormSubmitted"],
  ["到场时间", "day"],
  ["同行人数", "count"],
  ["补充说明", "note"],
  ["本场目标", "momentGoal"],
  ["Herstory 了解程度", "herstoryLevel"],
  ["HsHH 来源", "hshhSource"],
  ["共建生态意愿", "builderEcosystemCoCreate"],
  ["后续参与方向", "nextSteps"],
  ["授权确认", "consent"],
  ["联系偏好", "contactPrefs"],
  ["签到时间", "checkedInAt"],
  ["状态", "status"],
  ["提交时间", "createdAt"],
];

function AdminRegistrations() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<AdminListResponse>({ items: [], total: 0, page: 1, pageSize: 25 });
  const [selected, setSelected] = useState<RegistrationRecord | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [checkingInId, setCheckingInId] = useState("");

  const load = async () => {
    try {
      setError("");
      const params = new URLSearchParams({ q: query, page: "1", pageSize: "25" });
      setData(await api<AdminListResponse>(`/api/admin/registrations?${params.toString()}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "无法加载后台数据");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openDetail = async (id: string) => {
    try {
      setSelected(await api<RegistrationRecord>(`/api/admin/registrations/${id}`));
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "无法加载详情");
    }
  };

  const downloadCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/export.csv`, { credentials: "include" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "导出失败");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hshh-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  const deleteRecord = async (record: RegistrationRecord) => {
    const label = record.name || record.email || record.id;
    if (!window.confirm(`确认删除「${label}」的报名记录吗？删除后无法恢复。`)) return;
    setDeletingId(record.id);
    setError("");
    try {
      await api<{ ok: boolean; id: string }>(`/api/admin/registrations/${encodeURIComponent(record.id)}`, { method: "DELETE" });
      if (selected?.id === record.id) setSelected(null);
      setData((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        items: current.items.filter((item) => item.id !== record.id),
      }));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setDeletingId("");
    }
  };

  const toggleCheckIn = async (record: RegistrationRecord) => {
    setCheckingInId(record.id);
    setError("");
    try {
      const result = await api<{ checkedInAt: string | null }>(`/api/admin/registrations/${encodeURIComponent(record.id)}/check-in`, { method: "PATCH" });
      setData((current) => ({ ...current, items: current.items.map((item) => item.id === record.id ? { ...item, checkedInAt: result.checkedInAt } : item) }));
      if (selected?.id === record.id) setSelected({ ...selected, checkedInAt: result.checkedInAt });
    } catch (checkInError) {
      setError(checkInError instanceof Error ? checkInError.message : "签到状态更新失败");
    } finally {
      setCheckingInId("");
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div>
          <div className="lead-kicker">admin.dashboard()</div>
          <h1>报名后台</h1>
        </div>
        <div className="admin-head__actions"><a className="btn inline-link" href="/admin/projects">项目提交后台</a><a className="btn inline-link" href="/admin/judging">评委评分统计</a><a className="btn inline-link" href="/admin/events">观众投票后台</a><button className="btn primary" type="button" onClick={() => void downloadCsv()} disabled={exporting}>{exporting ? "导出中" : "导出 CSV"}</button></div>
      </header>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名 / 邮箱 / 手机 / 微信 / 城市" />
        <button className="btn primary" type="button" onClick={load}>搜索</button>
      </div>
      {error ? <div className="admin-error">{error}</div> : null}
      <div className="admin-count">共 {data.total} 条报名</div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr>{adminColumns.map(([label]) => <th key={label}>{label}</th>)}<th>操作</th></tr></thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                {adminColumns.map(([label, key]) => <td key={label}>{valueText(item[key])}</td>)}
                <td>
                  <div className="table-actions">
                    <button className="table-link" type="button" onClick={() => openDetail(item.id)}>详情</button>
                    <button className="table-link" type="button" onClick={() => void toggleCheckIn(item)} disabled={checkingInId === item.id}>{checkingInId === item.id ? "更新中" : item.checkedInAt ? "取消签到" : "现场签到"}</button>
                    <button className="table-link danger" type="button" onClick={() => void deleteRecord(item)} disabled={deletingId === item.id}>{deletingId === item.id ? "删除中" : "删除"}</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={adminColumns.length + 1}>暂无报名记录</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <PreviewDrawer data={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function App() {
  const path = window.location.pathname;
  if (path.startsWith("/success/")) return <SuccessPage id={decodeURIComponent(path.split("/").pop() || "")} />;
  if (path === "/submit") return <ProjectSubmissionPage />;
  if (path === "/dashboard") return <EventDashboard />;
  if (path === "/vote") return <VotingPage />;
  if (path === "/judge") return <JuryScoringPage />;
  if (path === "/volunteers") return <VolunteersPage />;
  if (path === "/admin/projects") return <ProjectAdminPage />;
  if (path === "/admin/events") return <EventAdminDashboard />;
  if (path === "/admin/judging") return <JuryAdminDashboard />;
  if (path.startsWith("/admin")) return <AdminRegistrations />;
  return <AudienceForm />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

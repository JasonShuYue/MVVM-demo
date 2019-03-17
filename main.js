function observe(data) {
    if(JSON.stringify(data) === '{}' || typeof data !== 'object') return;
    for(let key in data) {
        let val = data[key];
        let subject = new Subject(); // 每一个key都是一个主题
        Object.defineProperty(data, key, {
            get: function() {
                console.log(`get ${key}`)
                if(currentObserver) {
                    console.log('hasCurrentObserver');
                    currentObserver.subscribeTo(subject);
                }
                return val;
            },

            set: function(newVal) {
                val = newVal;
                console.log('start notify....');
                subject.notify();
            }
        })
        if(typeof val === 'object') {
            this.observe(val);
        }
    }
}

let id = 0;
let currentObserver = null;

class Subject {
    constructor() {
        this.id = id++;
        this.observers = [];
    }

    addObserver(observer) {
        let index = this.observers.indexOf(observer);
        if(index === -1) {
            this.observers.push(observer);
        }
    }

    removeObserver(observer) {
        let index = this.observers.indexOf(observer);
        if(index > -1) {
            this.observers.slice(index, 1);
        }
    }

    notify() {
        this.observers.forEach((observer) => {
            observer.update();
        })
    }

}

class Observer {
    constructor(vm, key, cb) {
        this.subjects = {}; // 存放该observer订阅的主题
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        this.value = this.getValue();
    }

    update() {
        let oldVal = this.value;
        let newVal = this.getValue();
        if(oldVal !== newVal) {
            // 值有更改,要更新
            this.value = newVal;
            this.cb.bind(this.vm)(newVal, oldVal);
        }
    }

    subscribeTo(subject) {
        if(! this.subjects[subject.id]) {
            // 如果我们还未订阅该主题
            console.log('SubscribeTo ...', subject);
            subject.addObserver(this);
            this.subjects[subject.id] = subject;
        }
    }

    getValue() {
        currentObserver = this;
        let value = this.vm.$data[this.key];
        currentObserver = null;
        return value;
    }
}


class MVVM {
    constructor(opts) {
        this.init(opts);
        observe(this.$data);
        // 编译
        new Compile(this)
    }

    init(opts) {
        this.$el = document.querySelector(opts.el);
        this.$data = opts.data;
        this.observes = [];
    }
}

class Compile {
    constructor(vm) {
        this.vm = vm;
        this.node = vm.$el;
        this.compile();
    }
    compile(){
        this.traverse(this.node)
    }
    traverse(node){
        if(node.nodeType === 1){
            this.compileNode(node)   //解析节点上的v-bind 属性
            node.childNodes.forEach(childNode=>{
                this.traverse(childNode)
            })
        }else if(node.nodeType === 3){ //处理文本
            this.compileText(node)
        }
    }
    compileText(node){
        let reg = /{{(.+?)}}/g
        let match
        console.log(node)
        while(match = reg.exec(node.nodeValue)){
            let raw = match[0]
            let key = match[1].trim()
            node.nodeValue = node.nodeValue.replace(raw, this.vm.$data[key])
            new Observer(this.vm, key, function(val, oldVal){
                node.nodeValue = node.nodeValue.replace(oldVal, val)
            })
        }
    }

    //处理指令
    compileNode(node){
        let attrs = [...node.attributes] //类数组对象转换成数组，也可用其他方法
        attrs.forEach(attr=>{
            //attr 是个对象，attr.name 是属性的名字如 v-model， attr.value 是对应的值，如 name
            if(this.isDirective(attr.name)){
                let key = attr.value       //attr.value === 'name'
                node.value = this.vm.$data[key]
                new Observer(this.vm, key, function(newVal){
                    node.value = newVal
                })
                node.oninput = (e)=>{
                    this.vm.$data[key] = e.target.value  //因为是箭头函数，所以这里的 this 是 compile 对象
                }
            }
        })
    }
    //判断属性名是否是指令
    isDirective(attrName){
        return attrName === 'v-model'
    }
}


let vm = new MVVM({
    el: '#app',
    data: {
        name: 'Jason',
        age: 23
    }
})


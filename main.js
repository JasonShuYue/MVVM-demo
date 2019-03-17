let id = 0;
let currentObserver = null;

// 主题类
class Subject {
    constructor() {
        this.id = id++;
        this.observers = [];
    }

    // 添加对象
    addObserver(observer) {
        this.observers.push(observer)
    }

    // 移除对象
    removeObserver(observer) {
        let index = this.observers.indexOf(observer);
        if(index > -1) {
            this.observers.slice(index, 1);
        }
    }

    // 发布通知
    notify() {
        this.observers.forEach((observer) => {
            observer.update()
        })
    }

}


// 对象类
class Observer {
    constructor(vm, key, cb) {
        this.subjects = {}; // 存放我们订阅的主题集合
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        this.value = this.getValue(); // ?
    }

    // 更新
    update() {
        let oldValue = this.value; //旧数据
        let newValue = this.getValue(); // 更新前，先获取新数据
        if(newValue !== oldValue) {
            // 数据有更新
            this.value = newValue;
            this.cb.bind(this.vm)(newValue, oldValue);
        }
    }

    // 订阅
    subscribeTo(subject) {
        if(! this.subjects[subject.id]) {
            console.log('subscribeTo..', subject);
            subject.addObserver(this);
            this.subjects[subject.id] = subject;
        }
    }

    // 获取当前key的value
    getValue() {
        currentObserver = this;
        let value = this.vm.$data[this.key];
        currentObserver = null;
        return value;
    }
}


// 监听函数
function observe(data) {
    if(!data || typeof data !== 'object') return;
    for(let key in data) {
        let value = data[key];
        //每一个key就是一个subject
        let subject = new Subject();
        console.log(data, key)
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get: function() {
                console.log(`get ${key}: ${value}`);
                if(currentObserver) {
                    // 通过currentObserver这个全局变量来判断是否订阅主题
                    console.log('has currentObserver');
                    currentObserver.subscribeTo(subject);
                }
                return value;
            },
            set: function(newValue) {
                value = newValue;
                console.log('start notify...');
                subject.notify();
            }
        })

        if(typeof value === 'object') {
            observe(value);
        }

    }
}


// MVVM类
class MVVM {

    constructor(opts) {
        this.init(opts);
        observe(this.$data);
        this.compile(); // 编译
    }

    init(opts) {
        this.$el = document.querySelector(opts.el);
        this.$data = opts.data;
        this.observers = [];

    }

    compile() {
        this.traverse(this.$el);
    }

    // 转换
    traverse(node) {
        if(node.nodeType === 1) {
            node.childNodes.forEach((childNode) => {
                this.traverse(childNode);
            })
        } else if(node.nodeType === 3) { //文本
            this.renderText(node);
        }
    }

    renderText(node) {
        let reg = /{{(.+?)}}/g;
        let match;

        while(match = reg.exec(node.nodeValue)) {
            let raw = match[0];
            let key = match[1].trim();

            node.nodeValue = node.nodeValue.replace(raw, this.$data[key]);

            new Observer(this, key, function(newValue, oldValue) {
                node.nodeValue = node.nodeValue.replace(oldValue, newValue)
            })
        }
    }
}

let vm = new MVVM({
    el: '#app',
    data: {
        name: 'Jason',
        age: 23
    }
})

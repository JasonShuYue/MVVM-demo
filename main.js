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
        this.compile();
    }

    init(opts) {
        this.$el = document.querySelector(opts.el);
        this.$data = opts.data;
        this.observes = [];
    }

    compile() {
        // 转换视图层的节点
        this.traverse(this.$el);
    }

    traverse(node) {
        if(node.nodeType === 1) { // 如果为节点,就递归转换
            node.childNodes.forEach((childNode) => {
                this.traverse(childNode);
            })
        } else if(node.nodeType === 3){ //如果是文本
            this.renderText(node); // 就渲染文字
        }
    }

    renderText(node) {
        let reg = /{{(.+?)}}/g;
        let match;
        while((match = reg.exec(node.nodeValue))) {
            let raw = match[0];
            let key = match[1].trim();
            node.nodeValue = node.nodeValue.replace(raw, this.$data[key]);
            // 针对每一个key，创建一个观察者
            new Observer(this, key, function(val, oldVal) {
                node.nodeValue = node.nodeValue.replace(oldVal, val);
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


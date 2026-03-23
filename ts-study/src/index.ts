import "reflect-metadata";
import {Expose, Type, instanceToPlain} from 'class-transformer'

class A{
    @Expose()
    type = "A";

    @Expose()
    a = 1;


}

class B{
    @Expose()
    type = "B"

    @Expose()
    b = 2;


}

class Test{
    @Expose()
    @Type(()=>Object, {
        discriminator:{
            property:"type",
            subTypes:[
                {name:"A", value:A},
                {name:"B", value:B}
            ]
        }
    })
    data!:A|B
}
const t = new Test();
t.data = new A();

console.log(instanceToPlain(t));

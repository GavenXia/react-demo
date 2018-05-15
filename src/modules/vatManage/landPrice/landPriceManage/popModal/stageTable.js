import React from "react";
import {Table,Card} from "antd";
import StageModal from './stagePopModal';
import {fMoney,toPercent} from 'utils';

const getColumns =(context,length)=>[
    {
        title:'操作',
        key:'actions',
        render:(text,record,index)=>{
            if(index === length-1){
                return (<span>合计：</span>)
            }else if(context.props.readOnly){
                return (<div>
                    <a style={{margin:'0 5px'}} onClick={()=>{
                        context.setState({visible:true,readOnly:true,type:'look',stage:record});}}>查看</a>
                </div>);
            }else{
            return (<div>
                <a style={{margin:'0 5px'}} onClick={()=>{
                    context.setState({visible:true,readOnly:true,type:'look',stage:record});}}>查看</a>
                <a style={{marginRight:5}} onClick={()=>{
                    context.setState({visible:true,readOnly:false,type:'edit',stage:record});}}>编辑</a>
            </div>);
            }
        },
        fixed:'left',
        width:context.props.readOnly?"50px":"75px"
    },
    {
        title: ['项目分期编码','项目分期名称'],
        dataIndex: ['itemNum','itemName'],
    }, {
        title: '计税方法',
        dataIndex: 'taxMethod',
        render:text=>{
            //1一般计税方法，2简易计税方法 ,
            switch(text){
                case 1:
                case '1':
                    return '一般计税方法';
                case 2:
                case '2':
                    return '简易计税方法';
                default:
                    return '';
            }
        }
    },{
        title: ['施工证面积（㎡）','调整后施工证面积（㎡）'],
        dataIndex: ['upArea','certificateArea'],
    },{
        title: ['可售面积（㎡）','调整后可售面积（㎡）'],
        dataIndex: ['upAreaSale','ableSaleArea'],
    },{
        title: ['可分摊土地价款比例','分摊后土地价款'],
        dataIndex: ['apportionLandPriceProportion','apportionLandPrice'],
        render:(text,record)=><div>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{toPercent(record.apportionLandPriceProportion)}</p>
                 <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{toPercent(record.apportionLandPrice)}</p>
                </div>
    },{
        title: ['可抵扣的土地价款比例','可抵扣的土地价款比例设置','可抵扣土地价款'],
        dataIndex: ['deductibleLandPriceProportion','setUp','deductibleLandPrice'],
        render:(text,record)=>{
          let str;
            if(record.setUp === 1 || record.setUp === "1"){
                str = <span>100%</span>;
            }else if(text === 2 || text === "2"){
                str = <span>按调整后可售面积（㎡）/调整后施工证面积（㎡）计算</span>;
            }
            return<div>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#000'}}>{toPercent(record.deductibleLandPriceProportion)}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{str}</p>
                     <p style={{marginBottom:'0px',lineHeight:'1.5',color:'#ccc'}}>{fMoney(record.deductibleLandPrice)}</p>
                    </div>
        }
    },{
        title: '已售建筑面积（㎡）',
        dataIndex: 'saleArea',
    },{
        title: '已实际抵扣土地价款',
        dataIndex: 'actualDeductibleLandPrice',
        render:text=>fMoney(text),
        className:'table-money'
    },{
        title: '单方土地成本',
        dataIndex: 'singleLandCost',
        render:text=>{
            return (text==='' || text ===undefined)?'':fMoney(text)
        },
        className:'table-money'
    }
];

export default class StageTable extends React.Component{
    state = {
        visible:false,
        readOnly:false,
        stage:{},
        type:undefined
    }
    showModal(){
        this.setState({visible:true});
    }
    hideModal(){
        this.setState({visible:false});
    }

    handleColumns = columns => {
      if(columns.length > 0){
        columns.map(item => {
          if(item.children){this.handleColumns(item.children)}
          if(item.title instanceof Array){
            let render
            item.title = <div className={item.className || 'text-center'}>
                  {
                    item.title.map((val,i) => {
                      return <p style={{marginBottom:'0px',lineHeight:'1.5',color:i === 0 ?'#000':'#ccc'}} key={i}>{val}</p>
                    })
                  }
                 </div>

            item.copyKey =[].concat(item.dataIndex)

                 if(item.render){
                    render = item.render
                 }else {
                   render =(text,record)=>(
                      <div>
                      {
                      item.copyKey.map((value,index) => {
                        return <p style={{marginBottom:'0px',lineHeight:'1.5',color:index === 0 ?'#000':'#ccc'}} key={index}>{record[`${value}`]===''?'-':record[`${value}`]}</p>
                      })
                      }
                     </div>
                   )
                 }
            item.render=render

            item.dataIndex = item.dataIndex.join('')
          }
          return item
        })
        return columns
      }else {
        return []
      }
    }
    render(){
        return (
            <Card title="项目分期信息" style={{ width: "100%" }}>
                <Table columns={this.handleColumns(getColumns(this,this.props.dataSource?this.props.dataSource.length:0))}  size="small" dataSource={this.props.dataSource} pagination={false} scroll={{x:"100%"}} rowKey="id"/>
                <StageModal
                type={this.state.type}
                visible={this.state.visible}
                readOnly={this.state.readOnly}
                hideModal={()=>{this.hideModal()}}
                update={(stage)=>{this.props.update(stage)}}
                stage = {this.state.stage}
                />
            </Card>
        );
    }
}

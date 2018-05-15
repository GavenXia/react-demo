import React, { Component } from 'react'
import {Form,Button,Icon} from 'antd'
import {SearchTable} from 'compoments'
import PopModal from './popModal'
const buttonStyle={
    marginRight:5
}
const formItemStyle={
    labelCol:{
        span:6
    },
    wrapperCol:{
        span:18
    }
}
const columns = [{
    title: '纳税主体',
    dataIndex: 'mainName',
}, {
    title: '档案类型',
    dataIndex: 'taxType',
},{
    title: '归档日期',
    dataIndex: 'type',
},{
    title: '归档资料名称',
    dataIndex: 'documentNum',
}];

const searchFields = [
    {
        label:'纳税主体',
        type:'taxMain',
        fieldName:'mainId',
        formItemStyle,
        span:6
    },
    {
      label:'所属期起止',
      type:'rangePicker',
      fieldName:'subordinatePeriod',
      formItemStyle,
      span:6,
    }
]

class DeclareFile extends Component {
    state={
        /**
         * params条件，给table用的
         * */
        filters:{},

        /**
         * 控制table刷新，要让table刷新，只要给这个值设置成新值即可
         * */
        tableUpDateKey:Date.now(),

        selectedRowKeys:null,
        visible:false,
        modalConfig:{
            type:''
        },
        expand:true
    }
    toggleModalVisible=visible=>{
        this.setState({
            visible
        })
    }
    handleSubmit = e => {
        e && e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                if(values.subordinatePeriod && values.subordinatePeriod.length!==0){
                    values.subordinatePeriodStart = values.subordinatePeriod[0].format('YYYY-MM-DD')
                    values.subordinatePeriodEnd = values.subordinatePeriod[1].format('YYYY-MM-DD')
                    values.subordinatePeriod = undefined;
                }

                this.setState({
                    selectedRowKeys:null,
                    filters:values
                },()=>{
                    this.setState({
                        tableUpDateKey:Date.now()
                    })
                });
            }
        });

    }
    onChange=(selectedRowKeys, selectedRows) => {
        this.setState({
            selectedRowKeys
        })
    }
    showModal=type=>{
        this.toggleModalVisible(true)
        this.setState({
            modalConfig:{
                type,
                id:this.state.selectedRowKeys
            }
        })
    }
    updateTable=()=>{
        this.handleSubmit()
    }
    componentDidMount(){
        this.updateTable()
    }
    render() {
        const {tableUpDateKey,selectedRowKeys,visible,modalConfig} = this.state;
        const rowSelection = {
            type:'radio',
            selectedRowKeys,
            onChange: this.onChange
        };
        return (
          <SearchTable
              searchOption={{
                  fields:searchFields,
              }}
              doNotFetchDidMount={true}
          tableOption={{
              key: tableUpDateKey,
              columns:columns,
              rowSelection:rowSelection,
              onRowSelect:(selectedRowKeys,selectedRows)=>{
                  this.setState({
                      selectedRowKeys,
                      selectedRows,
                  })
              },
              onSuccess:()=>{
                  this.setState({
                      selectedRowKeys:null,
                      selectedRows:[],
                  })
              },
              url:"/sys/declarationParam/list",
              extra:<div>
                  <Button disabled={!selectedRowKeys} size='small' onClick={()=>this.showModal('add')} style={buttonStyle}>
                      <Icon type="plus" />
                      新增
                  </Button>
                  <Button size='small' onClick={()=>this.showModal('view')} disabled={!selectedRowKeys} style={buttonStyle}>
                      <Icon type="search" />
                      查看
                  </Button>
              </div>,
          }}
          >
              <PopModal visible={visible} modalConfig={modalConfig} toggleModalVisible={this.toggleModalVisible} />
          </SearchTable>
        )
    }
}
export default Form.create()(DeclareFile)

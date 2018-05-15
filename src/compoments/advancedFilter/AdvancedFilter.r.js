/**
 * Created by xiaminghua on 2018/5/5.
 */

 import React,{Component} from 'react';
 import PropTypes from 'prop-types'
 import {Card,Col,Form,Row,Button} from 'antd'
 import {getFields} from 'utils'


export default class AdvancedFilter extends Component {
  static propTypes={
        advancedOptions:PropTypes.object,
        defaultFilters:PropTypes.object,
        advancedFilterShow:PropTypes.bool,
        handleSubmit:PropTypes.func,
        changeState:PropTypes.func
  }
  static defaultProps={
       advancedOptions:{
         cardStyle:{}
       },
       advancedFilterShow:false,
       defaultFilters:{}
  }
  constructor(props){
    super(props);
    this.state={

    }
  }


  render(){
          const {form , advancedOptions ,advancedFilterShow,handleSubmit,changeState,defaultFilters} = this.props
    return(
        <Card style={advancedOptions.cardStyle} className={advancedFilterShow?'advancedFilter show':'advancedFilter hide'}>
            <Form onSubmit={handleSubmit}>
                <Row>
                    {
                        getFields(form,advancedOptions.fields)
                    }
                    <Col className="btnAlignCenter" span="24" style={{textAlign:'right'}}>
                        <Button size='small' style={{marginTop:5,marginLeft:20}} type="primary" htmlType="submit">查询</Button>
                        <Button size='small' style={{marginTop:5,marginLeft:10}} onClick={()=>{
                            form.resetFields()
                            changeState({filters:{...defaultFilters},advancedFilterShow:false})
                            advancedOptions.onResetFields && advancedOptions.onResetFields();

                            advancedOptions.getFieldsValues && advancedOptions.getFieldsValues({})
                            advancedOptions.onFieldsChange && advancedOptions.onFieldsChange({})
                        }}>重置</Button>
                    </Col>
                </Row>
            </Form>
        </Card>
    )
  }
}

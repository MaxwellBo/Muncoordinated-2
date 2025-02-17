import {Accordion, AccordionTitleProps, ButtonProps, Flag, Form, Icon, Popup} from "semantic-ui-react";
import * as React from 'react';
import {useState} from 'react';
import {nameToFlagCode} from "../modules/member"
import {makeDropdownOption} from "../utils";
import {CommitteeID, pushTemplateMembers, Template, TEMPLATE_TO_MEMBERS} from "../models/committee";
import { FormattedMessage, useIntl } from 'react-intl';

export function TemplatePreview(props: { template?: Template }) {
  if (!props.template) {
    return (
      <p>
        <FormattedMessage 
          id="template.preview.select" 
          defaultMessage="Select a template to see which members will be added" 
        />
      </p>
    );
  }

  return (
    <>
      {TEMPLATE_TO_MEMBERS[props.template]
        .map(member =>
          <div key={member.name}>
            <Flag name={nameToFlagCode(member.name)} />
            {member.name}
          </div>
        )}
    </>
  );
}

export function TemplateAdder(props: { committeeID: CommitteeID }) {
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const intl = useIntl();

  const openAccordion = (event: React.MouseEvent<HTMLDivElement>, data: AccordionTitleProps) => {
    const newIndex = activeIndex === data.index as number ? -1 : data.index as number;
    setActiveIndex(newIndex);
  }

  const pushTemplate = (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
    event.preventDefault();

    if (template) {
      // Add countries as per selected templates
      pushTemplateMembers(props.committeeID, template);
    }
  }


  return (
    <Accordion>
      <Accordion.Title
        active={activeIndex === 0}
        index={0}
        onClick={openAccordion}
      >
        <Icon name='dropdown' />
        <FormattedMessage 
          id="template.title.add" 
          defaultMessage="Add members from a template (e.g. G20)" 
        />
      </Accordion.Title>
      <Accordion.Content active={activeIndex === 0}>
        <Form>
          <Form.Dropdown
            label={<FormattedMessage id="template.label.select" defaultMessage="Template" />}
            name="template"
            search
            clearable
            fluid
            selection
            placeholder={intl.formatMessage({ 
              id: 'template.placeholder.select', 
              defaultMessage: 'Select a template to add' 
            })}
            value={template}
            options={Object.values(Template).map(makeDropdownOption)}
            onChange={(event, data) => setTemplate(data.value as Template)}
          />
          <Popup
            basic
            hoverable
            position="bottom left"
            trigger={
              <Form.Button
                icon="plus"
                disabled={!template}
                primary
                basic
                onClick={pushTemplate}
                title={intl.formatMessage({ 
                  id: 'template.button.add', 
                  defaultMessage: 'Add members from template' 
                })}
              />
            }>
            <Popup.Content>
              <TemplatePreview template={template} />
            </Popup.Content>
          </Popup>
        </Form>
      </Accordion.Content>
    </Accordion>
  )
}

